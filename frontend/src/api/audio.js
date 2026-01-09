import api from './axios';

export const audioAPI = {
  analyzeAudio: async (file, locationLabel) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("locationLabel", locationLabel);

    const response = await api.post(
      "/api/audio/upload",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data;
  },
};
