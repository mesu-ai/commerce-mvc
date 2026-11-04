import { Router, Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { prisma } from "../../config/prisma";
import { config, isProduction } from "../../config";
import {
  exposeDevOtp,
  isMailConfigured,
  sendOtpMail,
} from "../../utils/mailer";

// Mounted at /careers/:id/otp, so :id (the job) comes from the parent router
const router = Router({ mergeParams: true });

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
// Fixed code for testing while no mail server is set up (never in production)
const TEST_OTP = "123123";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseId(value: unknown): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// Keyed with the server secret and bound to the job + email, so a leaked hash
// can't be brute-forced offline or replayed for another job
function hashCode(jobId: number, email: string, code: string) {
  return crypto
    .createHmac("sha256", config.jwt.secret)
    .update(`${jobId}:${email}:${code}`)
    .digest("hex");
}

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function isSameHash(a: string, b: string) {
  const left = Buffer.from(a, "hex");
  const right = Buffer.from(b, "hex");
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

// Public: emails a one-time code to the applicant for this job. Sending again
// (resend) replaces any earlier unverified code for the same job + email.
router.post(
  "/send",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const jobId = parseId(req.params.id);
      if (!jobId) {
        return res.status(400).json({
          success: false,
          message: "Invalid career ID",
        });
      }

      const { email: rawEmail, sscRegistrationNo: rawSsc } = req.body ?? {};
      const email =
        typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";
      const sscRegistrationNo =
        typeof rawSsc === "string" ? rawSsc.trim() : "";

      if (!sscRegistrationNo) {
        return res.status(400).json({
          success: false,
          message: "sscRegistrationNo is required",
        });
      }
      if (!EMAIL_PATTERN.test(email)) {
        return res.status(400).json({
          success: false,
          message: "Invalid email format",
        });
      }

      if (isProduction && !isMailConfigured) {
        return res.status(503).json({
          success: false,
          message: "Email service is not available. Please try again later.",
        });
      }

      const [career, applied, latest] = await Promise.all([
        prisma.career.findUnique({
          where: { jobId },
          select: { status: true, deadline: true, jobTitle: true },
        }),
        prisma.jobApplication.findFirst({
          where: { jobId, applicant: { email } },
          select: { applicationId: true },
        }),
        prisma.careerOtp.findFirst({
          where: { jobId, email, verifiedAt: null },
          orderBy: { createdAt: "desc" },
          select: { createdAt: true },
        }),
      ]);

      if (!career || career.status !== "Y") {
        return res.status(404).json({
          success: false,
          message: "Job not found or no longer open",
        });
      }
      if (career.deadline < new Date()) {
        return res.status(400).json({
          success: false,
          message: "The application deadline for this job has passed",
        });
      }
      if (applied) {
        return res.status(409).json({
          success: false,
          message: "You have already applied for this job",
        });
      }

      const waitMs = latest
        ? latest.createdAt.getTime() + OTP_RESEND_COOLDOWN_MS - Date.now()
        : 0;
      if (waitMs > 0) {
        const retryAfter = Math.ceil(waitMs / 1000);
        res.setHeader("Retry-After", String(retryAfter));
        return res.status(429).json({
          success: false,
          message: `Please wait ${retryAfter} seconds before requesting another OTP`,
          data: { retryAfter },
        });
      }

      const code = exposeDevOtp
        ? TEST_OTP
        : crypto
            .randomInt(0, 10 ** OTP_LENGTH)
            .toString()
            .padStart(OTP_LENGTH, "0");
      const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

      const [, otp] = await prisma.$transaction([
        prisma.careerOtp.deleteMany({
          where: { jobId, email, verifiedAt: null },
        }),
        prisma.careerOtp.create({
          data: {
            jobId,
            email,
            sscRegistrationNo,
            codeHash: hashCode(jobId, email, code),
            expiresAt,
          },
          select: { otpId: true },
        }),
      ]);

      try {
        await sendOtpMail(email, code, OTP_EXPIRY_MINUTES, career.jobTitle);
      } catch (err) {
        // A code nobody received must not block the next request
        await prisma.careerOtp.delete({ where: { otpId: otp.otpId } });
        throw err;
      }

      return res.status(200).json({
        success: true,
        message: `OTP sent to ${email}`,
        data: {
          otpId: otp.otpId,
          expiresAt,
          ...(exposeDevOtp && { devOtp: code }),
        },
      });
    } catch (err) {
      return next(err);
    }
  },
);

// Public: checks the code. On success returns a one-time verificationToken and
// the applicant's saved profile (matched by email + SSC registration no) so
// the apply form can be prefilled.
router.post(
  "/verify",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const jobId = parseId(req.params.id);
      if (!jobId) {
        return res.status(400).json({
          success: false,
          message: "Invalid career ID",
        });
      }

      const otpId = parseId(req.body?.otpId);
      const code = typeof req.body?.otp === "string" ? req.body.otp.trim() : "";
      if (!otpId || !new RegExp(`^\\d{${OTP_LENGTH}}$`).test(code)) {
        return res.status(400).json({
          success: false,
          message: `otpId and a ${OTP_LENGTH} digit otp are required`,
        });
      }

      const otp = await prisma.careerOtp.findUnique({ where: { otpId } });
      if (!otp || otp.jobId !== jobId || otp.verifiedAt) {
        return res.status(400).json({
          success: false,
          message: "OTP is invalid or already used. Please request a new one.",
        });
      }
      if (otp.expiresAt < new Date()) {
        return res.status(400).json({
          success: false,
          message: "OTP has expired. Please request a new one.",
        });
      }
      if (otp.attempts >= OTP_MAX_ATTEMPTS) {
        return res.status(429).json({
          success: false,
          message: "Too many wrong attempts. Please request a new OTP.",
        });
      }

      if (!isSameHash(otp.codeHash, hashCode(jobId, otp.email, code))) {
        // Counted in the database so parallel guesses can't skip the limit
        await prisma.careerOtp.updateMany({
          where: { otpId, attempts: { lt: OTP_MAX_ATTEMPTS } },
          data: { attempts: { increment: 1 } },
        });
        const attemptsLeft = Math.max(OTP_MAX_ATTEMPTS - otp.attempts - 1, 0);
        return res.status(400).json({
          success: false,
          message: attemptsLeft
            ? `Incorrect OTP. ${attemptsLeft} attempt(s) left.`
            : "Incorrect OTP. Please request a new one.",
          data: { attemptsLeft },
        });
      }

      const verificationToken = crypto.randomBytes(32).toString("base64url");
      const { count } = await prisma.careerOtp.updateMany({
        where: { otpId, verifiedAt: null },
        data: { verifiedAt: new Date(), tokenHash: hashToken(verificationToken) },
      });
      // Another request verified the same code first
      if (count === 0) {
        return res.status(400).json({
          success: false,
          message: "OTP is invalid or already used. Please request a new one.",
        });
      }

      const applicant = await prisma.applicant.findFirst({
        where: { email: otp.email, sscRegistrationNo: otp.sscRegistrationNo },
        omit: { applicantId: true, resume: true },
      });

      return res.status(200).json({
        success: true,
        message: "OTP verified successfully",
        data: {
          verificationToken,
          email: otp.email,
          sscRegistrationNo: otp.sscRegistrationNo,
          applicant,
        },
      });
    } catch (err) {
      return next(err);
    }
  },
);

export default router;
