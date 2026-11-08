
Trang nghe nhạc cá nhân dạng tĩnh. Mỗi phần có tệp riêng để dễ chỉnh sửa:

- `index.html` — cấu trúc trang và các điểm gắn kết cho trình phát.
- `css/styles.css` — giao diện, bố cục responsive và hiệu ứng.
- `js/tracks.js` — dữ liệu bài hát: `title`, `artist`, `audioSrc`, `coverImage` và `lyrics`.
- `js/app.js` — đọc `?track=1` đến `?track=4`, điều khiển audio, lyrics và visualizer.

Để thay bài hát, cập nhật một mục trong `js/tracks.js`. Mỗi lời bài hát có dạng
`{ time: số_giây, text: "Nội dung" }`. Có thể mở `index.html?track=2` để xem
bài thứ hai; nếu bỏ tham số hoặc giá trị không hợp lệ, trang sẽ chọn bài đầu tiên.

Các đường dẫn trong playlist là dữ liệu mẫu. Thay `audioSrc` và `coverImage`
bằng đường dẫn tệp thật trước khi phát hành.


