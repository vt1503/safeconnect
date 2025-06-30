export interface LocationData {
  country: string;
  countryCode: string;
  isVietnam: boolean;
}

interface IPApiResponse {
  country_name?: string;
  country_code?: string;
  [key: string]: unknown;
}

interface IpifyResponse {
  ip: string;
  [key: string]: unknown;
}

interface IpApiResponse {
  country?: string;
  countryCode?: string;
  [key: string]: unknown;
}

export class IPDetectionService {
  private static readonly TIMEOUT = 5000; // 5 seconds timeout

  // Fallback services for IP detection
  private static readonly IP_SERVICES = [
    {
      url: "https://ipapi.co/json/",
      extractData: (data: IPApiResponse): LocationData => ({
        country: data.country_name || "",
        countryCode: data.country_code || "",
        isVietnam: data.country_code === "VN",
      }),
    },
    {
      url: "https://api.ipify.org?format=json",
      extractData: async (data: IpifyResponse): Promise<LocationData> => {
        // Get IP first, then get location
        const ip = data.ip;
        const locationResponse = await fetch(`https://ipapi.co/${ip}/json/`);
        const locationData = (await locationResponse.json()) as IPApiResponse;
        return {
          country: locationData.country_name || "",
          countryCode: locationData.country_code || "",
          isVietnam: locationData.country_code === "VN",
        };
      },
    },
    {
      url: "https://ip-api.com/json/",
      extractData: (data: IpApiResponse): LocationData => ({
        country: data.country || "",
        countryCode: data.countryCode || "",
        isVietnam: data.countryCode === "VN",
      }),
    },
  ];

  static async detectLocation(): Promise<LocationData | null> {
    for (const service of this.IP_SERVICES) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT);

        const response = await fetch(service.url, {
          signal: controller.signal,
          headers: {
            Accept: "application/json",
          },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const locationData = await service.extractData(data);

        // Validate the data
        if (locationData.countryCode) {
          console.log("IP Detection successful:", locationData);
          return locationData;
        }
      } catch (error) {
        console.warn(`IP detection service failed:`, error);
        // Continue to next service
      }
    }

    console.warn("All IP detection services failed");
    return null;
  }

  static shouldShowLanguagePrompt(locationData: LocationData | null): boolean {
    if (!locationData) return false;

    // Show prompt if not from Vietnam
    return !locationData.isVietnam;
  }

  // Check if user has already been prompted in this session
  static hasBeenPrompted(): boolean {
    return sessionStorage.getItem("language-prompt-shown") === "true";
  }

  // Mark that user has been prompted
  static markAsPrompted(): void {
    sessionStorage.setItem("language-prompt-shown", "true");
  }

  // Check if user has made a language preference choice before
  static hasLanguagePreference(): boolean {
    return localStorage.getItem("language") !== null;
  }
}
