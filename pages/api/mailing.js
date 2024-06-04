import sgMail from "@sendgrid/mail";
import Cors from "cors";

export default async (req, res) => {
  sgMail.setApiKey(process.env.SG_API_KEY);

  //   const cors = Cors({
  //     origin: "http://localhost:3000", // URL where the API comes from (domain of client wordpress)
  //     methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  //   });

  //   async function runMiddleware(req, res, fn) {
  //     return new Promise((resolve, reject) => {
  //       fn(req, res, (result) => {
  //         if (result instanceof Error) {
  //           return reject(result);
  //         }
  //         return resolve(result);
  //       });
  //     });
  //   }

  //   await runMiddleware(req, res, cors);

  let templateId = "d-375461af31524f3783e1c5d04f58f000";
  let data = {
    subject: "Order",
    name: req.body.name,
    available: req.body.available,
  };
  const msg = {
    to: "alecmeganck@icloud.com",
    from: "alec@castaar.com",
    dynamicTemplateData: data,
    templateId: templateId,
  };
  try {
    // await sgMail.send(msg);
    res.status(200).json({ message: "Email sent successfully" });
  } catch (error) {
    console.log(error.response.body);
    res
      .status(500)
      .json({ error: "An error occurred while sending the email" });
  }
};
