import toast from "react-hot-toast";

export const showToast = (
  message: string,
  type: "success" | "error" | "loading" = "success"
) => {
  toast.dismiss();
  toast[type](message);
};
