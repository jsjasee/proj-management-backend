import Mailgen from "mailgen";
import nodemailer from "nodemailer";

const sendEmail = async (options) => {
  // Configure mailgen by setting a theme and your product info (mailgen docs)
  const mailGenerator = new Mailgen({
    theme: "default",
    product: {
      name: "Task Manager", // the name of your web-app
      link: "https://taskmanagerlink.com", // this doesn't exist, just a placeholder
    },
  }); // this mailGenerator is just branding the email

  const emailTextual = mailGenerator.generatePlaintext(options.mailgenContent); // plain text is for those whose brower may not support html
  const emailHTML = mailGenerator.generate(options.mailgenContent); // html supported

  // this is from MAILTRAP docs
  const transporter = nodemailer.createTransport({
    host: process.env.MAILTRAP_SMTP_HOST,
    port: process.env.MAILTRAP_SMTP_PORT,
    auth: {
      user: process.env.MAILTRAP_SMTP_USER,
      pass: process.env.MAILTRAP_SMTP_PASS,
    },
  });

  // use nodemailer to see how to use the transporter: https://nodemailer.com/
  const mail = {
    from: "mail.taskmanager@example.com",
    to: options.email, // receiver's email
    subject: options.subject,
    text: emailTextual,
    html: emailHTML, // browser will auto pick the html one if they support html, otherwise they will pick the Textual content if they don't support html
  };

  try {
    await transporter.sendMail(mail);
  } catch (error) {
    console.error(
      "Error occurred when sending email (tip: provide the correct MAILTRAP credentials in the .env file): ",
      error,
    );
  }
};

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

export {
  emailVerificationMailgenContent,
  forgotPasswordMailgenContent,
  sendEmail,
};
