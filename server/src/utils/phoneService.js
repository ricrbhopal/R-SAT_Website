import axios from "axios";

export const sendOTPPhone = async (phone, otp) => {
  if (!phone) {
    throw new Error("Phone number is required");
  }
  if (!otp) {
    throw new Error("OTP is required");
  }

  const whatsappMessage = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: phone,
    type: "template",
    template: {
      name: "ricr_otp",
      language: {
        code: "en",
      },
      components: [
        {
          type: "body",
          parameters: [
            {
              type: "text",
              text: otp,
            },
          ],
        },
        {
          type: "button",
          sub_type: "url",
          index: "0",
          parameters: [
            {
              type: "text",
              text: otp,
            },
          ],
        },
      ],
    },
  };

  const SenderPhoneID = process.env.WHATSAPP_BUSINESS_PHONE_NUMBER_ID;

  try {
    const response = await axios.post(
      `https://graph.facebook.com/v23.0/${SenderPhoneID}/messages`,
      whatsappMessage,
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
  }

  // Placeholder function to simulate sending OTP via phone (e.g., SMS or WhatsApp)
  return true;
};
