const express = require("express");
const OrganizationController = require("../controller/organization");
const useCatchErrors = require("../error/catchErrors");
const { verifyOTP, isAdmin, isAuthenticated } = require("../middlewares/auth");

class OrganizationRoute {
  router = express.Router();
  organizationController = new OrganizationController();
  path = "/organization";

  constructor() {
    this.initializeRoutes();
  }

  initializeRoutes() {
    this.router.post(
      `${this.path}/invite`,
      isAuthenticated,
      isAdmin,
      useCatchErrors(
        this.organizationController.createOrganizationInvite.bind(
          this.organizationController
        )
      )
    );

    this.router.post(
      `${this.path}/staff/signup`,
      verifyOTP,
      useCatchErrors(
        this.organizationController.staffSignUp.bind(
          this.organizationController
        )
      )
    );

    this.router.patch(
      `${this.path}/wallet/update`,
      isAuthenticated,
      isAdmin,
      useCatchErrors(
        this.organizationController.updateOrgWalletBalance.bind(
          this.organizationController
        )
      )
    );
    this.router.patch(
      `${this.path}/lunch/update`,
      isAuthenticated,
      isAdmin,
      useCatchErrors(
        this.organizationController.updateLunchPrice.bind(
          this.organizationController
        )
      )
    );

    // update organization info.
    this.router.put(
      `${this.path}/create`,
      isAuthenticated,
      isAdmin,
      useCatchErrors(
        this.organizationController.updateOrganizationInfo.bind(
          this.organizationController
        )
      )
    );
  }
}

module.exports = OrganizationRoute;
