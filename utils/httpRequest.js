class HttpRequest {
  constructor() {
    // Base URL cố định cho API Spotify Clone
    this.baseUrl = "https://spotify.f8team.dev/api/";
  }

  async _send(path, method, data, options = {}) {
    try {
      const _options = {
        ...options,
        method,
        headers: {
          ...options.headers,
          "Content-Type": "application/json", // đảm bảo luôn gửi JSON
        },
      };

      if (data) {
        _options.body = JSON.stringify(data);
      }

      // Nếu có accessToken trong localStorage thì tự động gắn Authorization
      const accessToken = localStorage.getItem("accessToken");
      if (accessToken) {
        _options.headers.Authorization = `Bearer ${accessToken}`;
      }

      // Gọi API
      const res = await fetch(`${this.baseUrl}${path}`, _options);

      // Luôn đọc JSON từ response (kể cả khi lỗi)
      const response = await res.json();

      if (!res.ok) {
        // Tạo Error và gắn thêm thông tin server trả về
        const error = new Error(`HTTP error: ${res.status}`);
        error.response = response; // chứa nội dung JSON thật từ server
        error.status = res.status; // chứa mã lỗi HTTP (400, 401, 409, v.v.)
        throw error;
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  async get(path, options) {
    return await this._send(path, "GET", null, options);
  }

  async post(path, data, options) {
    return await this._send(path, "POST", data, options);
  }

  async put(path, data, options) {
    return await this._send(path, "PUT", data, options);
  }

  async patch(path, data, options) {
    return await this._send(path, "PATCH", data, options);
  }

  async del(path, options) {
    return await this._send(path, "DELETE", null, options);
  }
}

// Khởi tạo đối tượng duy nhất cho toàn dự án
const httpRequest = new HttpRequest();
export default httpRequest;
