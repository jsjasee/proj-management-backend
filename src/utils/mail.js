import Mailgen from "mailgen";

const emailVerificationMailgenContent = (username, verificationUrl) => {
  return {
    body: {
      name: username,
      intro: "Welcome to our App! We are excited to have your on board.",
      action: {
        intructions:
          "To verify your email please click on the following button",
        button: {
          color: "#22BC66",
          text: "Verify your email",
          link: verificationUrl,
        },
      },
      outro:
        "Need help, or have questions? Just reach out to our customer support team. :)",
    },
  };
};

const forgotPasswordMailgenContent = (username, passwordResetUrl) => {
  return {
    body: {
      name: username,
      intro: "We received a request to reset the password of your account.",
      action: {
        intructions:
          "To reset your password, click on the following button or link.",
        button: {
          color: "#bc2222",
          text: "Reset password",
          link: passwordResetUrl,
        },
      },
      outro:
        "Need help, or have questions? Just reach out to our customer support team. :)",
    },
  };
};

export { emailVerificationMailgenContent, forgotPasswordMailgenContent };
