const { PrismaClient } = require("@prisma/client");
const short = require("short-uuid");
const prisma = new PrismaClient();
const BaseController = require("./base");
const { passwordManager } = require("../helper/index");
const { StaffSignupSchema } = require("../helper/validate");

class OrganizationController extends BaseController {
  constructor() {
    super();
  }

  async staffSignUp(req, res) {
    // validate payload
    const { error } = StaffSignupSchema.validate(req.body);

    if (error) {
      return this.error(res, error.message, 400);
    }

    const { email, password, first_name, last_name, phone_number } = req.body;
    const hashedPassword = passwordManager.hash(password);
    const id = short.generate();
    const formattedDate = new Date().toISOString();

    // check if staff exists for this organization
    const staffExists = await prisma.user.findFirst({
      where: {
        AND: {
          email,
          org_id: req.user?.org_id,
        },
      },
    });

    if (staffExists !== null) {
      return this.error(res, "User already exists", 400);
    }

    const newStaff = await prisma.user.create({
      data: {
        id,
        email,
        password_hash: hashedPassword,
        org_id: req.user?.org_id,
        refresh_token: "",
        first_name,
        last_name,
        profile_picture: `https://api.dicebear.com/7.x/micah/svg?seed=${first_name}`,
        phonenumber: phone_number,
        updated_at: formattedDate,
        created_at: formattedDate,
        isAdmin: false,
      },
    });
    this.success(res, "Staff member created successfully", 201, newStaff);
  }

  async updateOrgWalletBalance(req, res) {
    const user = req.user;
    const { org_id } = user;
    const payload = req.body;

    if (typeof payload.amount === "undefined") {
      this.error(res, "Balance is missing", 400);
      return;
    }

    const newBalance = +payload.amount;

    const orgLunchWallet = await prisma.organizationLunchWallet.findFirst({
      where: { org_id },
    });

    const prevBalance = +orgLunchWallet.balance;
    const totalBalance = prevBalance + newBalance;

    // update org lunch wallet balance
    await prisma.organizationLunchWallet.update({
      where: { id: orgLunchWallet.id },
      data: { balance: String(totalBalance) },
    });

    this.success(res, "Successfully topped-up lunch wallet", 200);
  }
  async updateLunchPrice(req, res) {
    const orgId = req.user.org_id; 
    const { lunch_price } = req.body; 
    try {
      const existingOrganization = await prisma.organization.findUnique({
        where: {
          id: orgId,
        },
      });
      if (!existingOrganization) {
        return this.error(
          res,
          `Organization with id ${orgId} does not exist`,
          404
        );
      }
      const updatedOrganization = await prisma.organization.update({
        where: {
          id: orgId,
        },
        data: {
          lunch_price: lunch_price,
        },
      });
      if (!updatedOrganization) {
        return this.error(res, "Failed to update lunch_price", 500);
      }
      this.success(res, {message:"sucess"},{statuscode:200}, {data:null});
    } catch (error) {
      console.error(error);
      return this.error(res, "Internal server error", 500);
    }
  }
}

module.exports = OrganizationController;
