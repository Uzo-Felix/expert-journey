// is authenticated
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const jwtSecret = process.env.JWT_SECRET;

async function isAuthenticated(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  try {
    const decodedToken = jwt.verify(token, jwtSecret);
    const { user_id } = decodedToken;
    const user = await prisma.user.findUnique({
      where: { id: user_id },
    });
    if (!user) {
      return res.status(404).json({ message: "Unauthorised" });
    }
    req.user = {
      user_id: user.id,
      org_id: user.org_id,
    };
    next();
  } catch (err) {
    return res.status(403).json({ message: "Forbidden" });
  }
}

async function isAdmin(req, res, next) {
  const errormessage = "Not enough permissions to perform this action";

  const user_id = req.user?.user_id; // req.user will be already set by isAuthenticated middleware
  if (!user_id) {
    return res.status(403).json({ message: errormessage });
  }
  try {
    const { isAdmin } = await prisma.user.findFirstOrThrow({
      where: { id: user_id },
    });
    if (!isAdmin) {
      return res.status(403).json({ message: errormessage });
    }
    req.user.isAdmin = true;
    next();
  } catch (err) {
    return res.status(403).json({ message: errormessage });
  }
}

async function verifyOTP(req, res, next) {
  const payload = req.body;
  if (typeof payload?.otp_token === "undefined") {
    return res
      .status(404)
      .json({ message: "expected valid OTP code but got none." });
  }

  const OTP = payload.otp_token;

  // check if otp exists
  try {
    const otpExists = await prisma.organizationInvite.findFirst({
      where: { token: OTP },
      include: { organization: true },
    });

    if (otpExists === null) {
      return res.status(404).json({ message: "Invalid OTP code." });
    }

    // delete token from db
    await prisma.organizationInvite.delete({
      where: { id: otpExists?.organization?.id },
    });

    req.user = { org_id: otpExists?.organization.id };
    next();
  } catch (e) {
    logger.error(`Invalid OTP code: ${e.message}`);
    res.status(500).json({ message: "Something went wrong verifying OTP" });
  }
}

module.exports = {
  isAuthenticated,
  isAdmin,

  verifyOTP,
};
