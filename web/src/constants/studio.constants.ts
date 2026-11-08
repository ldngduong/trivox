export const CAMERA_PRESETS = [
  { id: 'standard', label: 'Góc nghiêng' },
  { id: 'front', label: 'Mặt trước' },
  { id: 'side', label: 'Mặt bên' },
  { id: 'top', label: 'Từ trên' },
] as const;

export const QUICK_PROMPTS = [
  'Đổi thân chính sang màu trắng nhám',
  'Bo tròn các cạnh ngoài thêm 4 mm',
  'Thêm bản lề mở nắp trên từ 0 đến 110 độ',
  'Tăng chiều cao tổng thể thêm 20%',
] as const;

export const LANDING_ECOSYSTEM_ITEMS = [
  'Blender (.blend)',
  'glTF 2.0 (.glb)',
  'Three.js',
  'Unity',
  'Unreal Engine',
] as const;

export const LANDING_PILLARS = [
  {
    id: 'parts',
    title: 'Chi tiết tách rời độc lập',
    description:
      'Thân vỏ, nắp đậy, tay nắm và khung đỡ là các đối tượng riêng biệt, không bị dính thành một khối lưới đặc.',
  },
  {
    id: 'joints',
    title: 'Khớp chuyển động thực tế',
    description:
      'Hỗ trợ bản lề xoay, ray trượt và trục quay liên tục để kiểm tra đóng mở trực tiếp trên trình duyệt.',
  },
  {
    id: 'edit',
    title: 'Sửa nhanh bằng câu lệnh',
    description:
      'Yêu cầu đổi màu, thay đổi kích thước hoặc thêm bộ phận mới mà vẫn giữ nguyên các chi tiết còn lại.',
  },
] as const;
