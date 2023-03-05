import config from "@/config";

export default {
  auth: {
    clear: async () => {
      return await fetch(config.restApiUrl + "/auth/clear", {
        method: "DELETE",
        credentials: "include",
      });
    },
  },
};
