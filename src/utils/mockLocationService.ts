export interface MockLocation {
  lat: number;
  lng: number;
  address: string;
  district: string;
}

export class MockLocationService {
  // Một số điểm ngẫu nhiên tại Hà Nội để tạo vị trí giả
  private static readonly HANOI_LOCATIONS: MockLocation[] = [
    {
      lat: 21.0285,
      lng: 105.8542,
      address: "Hồ Hoàn Kiếm, Hoàn Kiếm",
      district: "Hoàn Kiếm",
    },
    {
      lat: 21.0367,
      lng: 105.8345,
      address: "Lăng Chủ tịch Hồ Chí Minh, Ba Đình",
      district: "Ba Đình",
    },
    {
      lat: 21.0313,
      lng: 105.8516,
      address: "Nhà thờ Lớn Hà Nội, Hoàn Kiếm",
      district: "Hoàn Kiếm",
    },
    {
      lat: 21.0245,
      lng: 105.8412,
      address: "Phố cổ Hà Nội, Hoàn Kiếm",
      district: "Hoàn Kiếm",
    },
    {
      lat: 21.0583,
      lng: 105.8542,
      address: "Đền Ngọc Sơn, Hoàn Kiếm",
      district: "Hoàn Kiếm",
    },
    {
      lat: 21.0452,
      lng: 105.8467,
      address: "Đại học Kinh tế Quốc dân, Hai Bà Trưng",
      district: "Hai Bà Trưng",
    },
    {
      lat: 21.0395,
      lng: 105.821,
      address: "Công viên Thủ Lệ, Đống Đa",
      district: "Đống Đa",
    },
    {
      lat: 21.0478,
      lng: 105.8341,
      address: "Chùa Một Cột, Ba Đình",
      district: "Ba Đình",
    },
    {
      lat: 21.0358,
      lng: 105.8602,
      address: "Trung tâm thương mại Tràng Tiền Plaza, Hoàn Kiếm",
      district: "Hoàn Kiếm",
    },
    {
      lat: 21.0412,
      lng: 105.8288,
      address: "Bảo tàng Dân tộc học Việt Nam, Cầu Giấy",
      district: "Cầu Giấy",
    },
  ];

  /**
   * Tạo vị trí giả ngẫu nhiên tại Hà Nội
   */
  static generateRandomHanoiLocation(): MockLocation {
    const randomIndex = Math.floor(Math.random() * this.HANOI_LOCATIONS.length);
    const baseLocation = this.HANOI_LOCATIONS[randomIndex];

    // Thêm một chút nhiễu ngẫu nhiên để tạo vị trí unique (±0.005 độ ≈ ±500m)
    const latOffset = (Math.random() - 0.5) * 0.01;
    const lngOffset = (Math.random() - 0.5) * 0.01;

    return {
      lat: baseLocation.lat + latOffset,
      lng: baseLocation.lng + lngOffset,
      address: baseLocation.address,
      district: baseLocation.district,
    };
  }

  /**
   * Lấy vị trí trung tâm Hà Nội (Hồ Hoàn Kiếm)
   */
  static getHanoiCenter(): MockLocation {
    return this.HANOI_LOCATIONS[0]; // Hồ Hoàn Kiếm
  }

  /**
   * Kiểm tra vị trí có phải trong khu vực Hà Nội không
   */
  static isInHanoi(lat: number, lng: number): boolean {
    // Giới hạn tọa độ của Hà Nội (xấp xỉ)
    const HANOI_BOUNDS = {
      north: 21.2,
      south: 20.9,
      east: 105.95,
      west: 105.7,
    };

    return (
      lat >= HANOI_BOUNDS.south &&
      lat <= HANOI_BOUNDS.north &&
      lng >= HANOI_BOUNDS.west &&
      lng <= HANOI_BOUNDS.east
    );
  }

  /**
   * Lưu vị trí giả vào session storage
   */
  static saveMockLocation(location: MockLocation): void {
    sessionStorage.setItem("mockLocation", JSON.stringify(location));
    sessionStorage.setItem("usingMockLocation", "true");
  }

  /**
   * Lấy vị trí giả từ session storage
   */
  static getMockLocation(): MockLocation | null {
    const stored = sessionStorage.getItem("mockLocation");
    return stored ? JSON.parse(stored) : null;
  }

  /**
   * Kiểm tra có đang sử dụng vị trí giả không
   */
  static isUsingMockLocation(): boolean {
    return sessionStorage.getItem("usingMockLocation") === "true";
  }

  /**
   * Xóa vị trí giả
   */
  static clearMockLocation(): void {
    sessionStorage.removeItem("mockLocation");
    sessionStorage.removeItem("usingMockLocation");
  }

  /**
   * Tạo và lưu vị trí giả mới
   */
  static createAndSaveMockLocation(): MockLocation {
    const mockLocation = this.generateRandomHanoiLocation();
    this.saveMockLocation(mockLocation);
    return mockLocation;
  }

  /**
   * Kiểm tra setting có cho phép sử dụng mock location không
   * @param isVietnam - true nếu IP là từ Việt Nam, false nếu IP nước ngoài
   */
  static isMockLocationSettingEnabled(isVietnam?: boolean): boolean {
    const savedSetting = localStorage.getItem("mockLocationEnabled");

    // Nếu đã có setting được lưu, dùng setting đó
    if (savedSetting !== null) {
      return savedSetting === "true";
    }

    // Nếu chưa có setting, áp dụng default dựa trên IP:
    // - IP Việt Nam: default false (không cần mock location)
    // - IP nước ngoài: default true (cần mock location để sử dụng app)
    // - Không xác định được IP: default true (an toàn hơn)
    return isVietnam === false; // true cho foreign IP, false cho Vietnamese IP
  }

  /**
   * Bật/tắt setting mock location
   */
  static setMockLocationSetting(enabled: boolean): void {
    localStorage.setItem("mockLocationEnabled", enabled.toString());

    // Nếu tắt và đang sử dụng mock location, clear nó
    if (!enabled && this.isUsingMockLocation()) {
      this.clearMockLocation();
    }
  }

  /**
   * Kiểm tra có nên hiển thị mock location prompt không
   * (dựa trên setting và IP location)
   */
  static shouldShowMockLocationPrompt(isVietnam: boolean): boolean {
    if (isVietnam) return false; // User ở VN không cần mock location
    if (!this.isMockLocationSettingEnabled(isVietnam)) return false; // Setting bị tắt
    if (this.isUsingMockLocation()) return false; // Đã đang dùng mock location

    const hasBeenPrompted =
      sessionStorage.getItem("map-location-prompt-shown") === "true";
    return !hasBeenPrompted;
  }

  /**
   * Lấy tổng quan về mock location status
   */
  static getMockLocationStatus(isVietnam?: boolean): {
    settingEnabled: boolean;
    isUsing: boolean;
    currentLocation: MockLocation | null;
  } {
    return {
      settingEnabled: this.isMockLocationSettingEnabled(isVietnam),
      isUsing: this.isUsingMockLocation(),
      currentLocation: this.getMockLocation(),
    };
  }
}
