import { prepareURLEncodedParams } from "@/lib/helpers/prepareUrlEncodedParams";
import { removeUserDetails } from "@/lib/redux/Modules/userlogin";
import { BASEURL } from "@/helpers/getBaseURL";
import { store } from "@/lib/redux";
import Cookies from "js-cookie";

interface IAPIResponse {
  success: boolean;
  status: number;
  data: any;
}
class FetchService {
  authStatusCodes: number[] = [401, 403];
  authErrorURLs: string[] = [
    "/users/signin",
    "/forgot-password",
    "/forgot-password/update-password",
  ];

  private _fetchType: string;
  private _noHeaders: Boolean;
  private _isLoginService: Boolean;
  constructor(
    fetchTypeValue = "json",
    headerOrNot = true,
    isLoginService = false
  ) {
    this._fetchType = fetchTypeValue;
    this._noHeaders = headerOrNot;
    this._isLoginService = isLoginService;
    store.subscribe(() => {});
  }

  configureAuthorization(config: any) {
    let accessToken = "Bearer ";

    const encodedString = Cookies.get("token");

    config.headers["Authorization"] = accessToken + encodedString;
  }
  setHeader(config: any) {
    config.headers = {};
  }
  setDefualtHeaders(config: any) {
    config.headers = {
      "Content-Type": "application/json",
    };
  }

  dispatchRemoveUserDetails() {
    store.dispatch(removeUserDetails());
  }
  checkToLogOutOrNot(path: string) {
    return this.authErrorURLs.some((arrayUrl: string) =>
      path.includes(arrayUrl)
    );
  }
  isAuthRequest(path: string) {
    return this.authErrorURLs.includes(path);
  }

  async hit(...args: any): Promise<IAPIResponse> {
    let [path, config] = args;
    this.setDefualtHeaders(config);

    if (!this._noHeaders) {
      this.setHeader(config);
    }

    if (!this.isAuthRequest(path) && !this._isLoginService) {
      this.configureAuthorization(config);
    }

    let url = BASEURL + path;

    const response: any = await fetch(url, config);

    if (response?.status == 200 || response?.status == 201) {
      if (this._fetchType == "response") {
        return {
          success: true,
          status: response.status,
          data: response,
        };
      } else {
        return {
          success: true,
          status: response.status,
          data: await response.json(),
        };
      }
    } else if (
      this.authStatusCodes.includes(response.status) &&
      !this.checkToLogOutOrNot(path)
    ) {
      setTimeout(() => {
        this.dispatchRemoveUserDetails();
        Cookies.remove("token");
        window.location.href = "/";
      }, 1000);
      return {
        success: false,
        data: { ...(await response.json()), message: "Session Expired" },
        status: response.status,
      };
    } else {
      return {
        status: response?.status,
        success: false,
        data: await response.json(),
      };
    }
  }
  async post(url: string, payload?: any) {
    return await this.hit(url, {
      method: "POST",
      body: payload ? JSON.stringify(payload) : undefined,
    });
  }
  async postFormData(url: string, file?: any) {
    return await this.hit(url, {
      method: "POST",
      body: file,
    });
  }

  async get(url: string, queryParams = {}) {
    if (Object.keys(queryParams).length) {
      url = prepareURLEncodedParams(url, queryParams);
    }
    return await this.hit(url, {
      method: "GET",
    });
  }
  async delete(url: string, payload = {}) {
    return this.hit(url, {
      method: "DELETE",
      body: JSON.stringify(payload),
    });
  }
  async deleteWithOutPayload(url: string) {
    return this.hit(url, {
      method: "DELETE",
    });
  }
  async put(url: string, payload = {}) {
    return this.hit(url, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  }
  async patch(url: string, payload = {}) {
    return this.hit(url, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }
}
export const $fetch = new FetchService("json", true);
export const $secondaryFetch = new FetchService("response", true);
export const $fetchNoHeaders = new FetchService("json", false);
export const $secondaryFetchNoHeaders = new FetchService("response", false);
export const $loginFetch = new FetchService("json", true, true);
