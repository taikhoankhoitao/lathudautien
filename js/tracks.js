(() => {
function createCoverImage(topColor, bottomColor, title, number) {
  const artwork = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
      <defs>
        <linearGradient id="background" x1="0" y1="0" x2="1" y2="1">
          <stop stop-color="${topColor}"/>
          <stop offset="1" stop-color="${bottomColor}"/>
        </linearGradient>
        <radialGradient id="light">
          <stop stop-color="#fff" stop-opacity=".45"/>
          <stop offset="1" stop-color="#fff" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="400" height="400" fill="url(#background)"/>
      <circle cx="285" cy="112" r="185" fill="url(#light)"/>
      <circle cx="200" cy="200" r="138" fill="none" stroke="#fff" stroke-opacity=".22" stroke-width="2"/>
      <circle cx="200" cy="200" r="100" fill="none" stroke="#fff" stroke-opacity=".16" stroke-width="2"/>
      <text x="200" y="185" fill="#fff" fill-opacity=".72" font-family="Arial,sans-serif" font-size="18" font-weight="700" letter-spacing="7" text-anchor="middle">BLUE HOUR</text>
      <text x="200" y="237" fill="#fff" font-family="Arial,sans-serif" font-size="42" font-weight="700" text-anchor="middle">${number}</text>
      <text x="200" y="344" fill="#fff" fill-opacity=".86" font-family="Arial,sans-serif" font-size="16" font-weight="600" letter-spacing="2" text-anchor="middle">${title}</text>
    </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(artwork)}`;
}

const tracks = [
  {
    title: "Một bản nhạc của riêng mình",
    artist: "Tên nghệ sĩ",
    audioSrc: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    coverImage: createCoverImage("#4197dd", "#10294b", "BLUE HOUR", "01"),
    lyrics: [
      { time: 0, text: "Đêm khẽ nghiêng bên ô cửa xanh" },
      { time: 5, text: "Một vệt trăng nằm yên trên phố" },
      { time: 10, text: "Ta gom những dịu dàng còn sót" },
      { time: 15, text: "Gửi theo tiếng mưa qua hiên nhà" },
      { time: 20, text: "Ngày mai rồi sẽ trong như gió" },
      { time: 25, text: "Bình yên ghé lại giữa đôi tay" },
      { time: 30, text: "Và nếu con đường xa thêm nữa" },
      { time: 35, text: "Mình vẫn nghe nhau trong bài ca" },
      { time: 40, text: "Một ánh sao vừa lên rất khẽ" },
      { time: 45, text: "Đưa những ước mơ về thật gần" },
    ],
  },
  {
    title: "Phía bên kia mùa hạ",
    artist: "Tên nghệ sĩ",
    audioSrc: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    coverImage: createCoverImage("#ef9e75", "#513b67", "AFTER SUMMER", "02"),
    lyrics: [
      { time: 0, text: "Nắng còn vương trên hàng cây cũ" },
      { time: 6, text: "Gió khẽ đưa mùa qua mái hiên" },
      { time: 12, text: "Ta bước qua những ngày rực rỡ" },
      { time: 18, text: "Mang theo tiếng ve vào giấc mơ" },
      { time: 24, text: "Phía bên kia mùa hạ đang chờ" },
      { time: 30, text: "Một khoảng trời dịu êm như thơ" },
      { time: 36, text: "Dẫu mai này đôi đường xa lạ" },
      { time: 42, text: "Xin giữ lại mùa hè trong ta" },
    ],
  },
  {
    title: "Thành phố ngủ quên",
    artist: "Tên nghệ sĩ",
    audioSrc: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    coverImage: createCoverImage("#687fc2", "#18243d", "SLEEPING CITY", "03"),
    lyrics: [
      { time: 0, text: "Đèn khuya soi con đường rất vắng" },
      { time: 7, text: "Bước chân chậm qua những hiên nhà" },
      { time: 14, text: "Thành phố ngủ quên trong im lặng" },
      { time: 21, text: "Chỉ còn mình thức với ngân nga" },
      { time: 28, text: "Có đôi điều chưa kịp nói ra" },
      { time: 35, text: "Gửi vào đêm theo làn mây xa" },
      { time: 42, text: "Khi bình minh khẽ chạm ô cửa" },
      { time: 49, text: "Mong lòng mình thôi những phong ba" },
    ],
  },
  {
    title: "Ngày mới dịu dàng",
    artist: "Tên nghệ sĩ",
    audioSrc: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    coverImage: createCoverImage("#6bc4c1", "#244879", "A GENTLE DAY", "04"),
    lyrics: [
      { time: 0, text: "Bình minh rơi trên vai thật nhẹ" },
      { time: 7, text: "Tách trà thơm bên khung cửa quen" },
      { time: 14, text: "Ngoài hiên chim gọi ngày thức giấc" },
      { time: 21, text: "Mọi ưu phiền theo gió bay lên" },
      { time: 28, text: "Ngày mới dịu dàng như lời hát" },
      { time: 35, text: "Dẫn bước chân qua những an yên" },
      { time: 42, text: "Ta lại tin vào điều tốt đẹp" },
      { time: 49, text: "Và mỉm cười với nắng đầu tiên" },
    ],
  },
];

window.musicTracks = tracks;
})();
