/**
 * js/customer/rating.js
 * Xử lý đánh giá chuyến đi (chọn sao, gửi feedback về backend).
 */

document.addEventListener('DOMContentLoaded', () => {
    // Tìm các phần tử trong DOM
    const starContainer = document.getElementById('star-rating-container');
    const stars = document.querySelectorAll('.star-rating__star');
    const btnSubmit = document.getElementById('btn-submit-rating');
    const btnSkip = document.getElementById('btn-skip-rating');
    const feedbackInput = document.getElementById('rating-feedback');

    // Bỏ qua nếu không phải trang rating
    if (!starContainer) return;

    let selectedRating = 0; // Lưu số sao hiện tại

    // ==========================================
    // 1. LOGIC CHỌN SAO (HOVER & CLICK)
    // ==========================================
    
    // Hàm tô màu sao (Sử dụng màu từ common.css của team)
    function highlightStars(count) {
        stars.forEach(star => {
            const starValue = parseInt(star.getAttribute('data-value'));
            if (starValue <= count) {
                star.textContent = '★'; // Chuyển thành sao đặc
                star.style.color = 'var(--color-yellow)'; // Màu vàng hệ thống
                star.style.cursor = 'pointer';
            } else {
                star.textContent = '☆'; // Chuyển thành sao rỗng
                star.style.color = 'var(--color-gray-300)'; // Màu xám nhạt
                star.style.cursor = 'pointer';
            }
            star.style.fontSize = '2.5rem'; // Làm cho sao to và dễ bấm trên mobile
            star.style.transition = 'color 0.2s ease-in-out';
        });
    }

    // Khởi tạo mặc định là 5 sao
    selectedRating = 5;
    highlightStars(selectedRating);

    stars.forEach(star => {
        // Hiệu ứng khi di chuột qua (Hover)
        star.addEventListener('mouseover', function() {
            const hoverValue = parseInt(this.getAttribute('data-value'));
            highlightStars(hoverValue);
        });

        // Khi chuột rời khỏi khu vực sao, trả lại màu theo số sao đã chọn
        star.addEventListener('mouseout', function() {
            highlightStars(selectedRating);
        });

        // Khi click để chốt số sao
        star.addEventListener('click', function() {
            selectedRating = parseInt(this.getAttribute('data-value'));
            highlightStars(selectedRating);
        });
    });

    // ==========================================
    // 2. GỬI ĐÁNH GIÁ LÊN SERVER
    // ==========================================
    if (btnSubmit) {
        btnSubmit.addEventListener('click', async () => {
            // Lấy tripId đã lưu từ bước booking/tracking
            const tripId = sessionStorage.getItem('current_trip_id');
            const feedback = feedbackInput.value.trim();

            if (!tripId) {
                alert('Không tìm thấy thông tin chuyến đi! Đang quay lại trang chủ.');
                window.location.href = 'dashboard.html';
                return;
            }

            // Đổi trạng thái nút thành Loading
            const originalText = btnSubmit.textContent;
            btnSubmit.textContent = 'Đang gửi...';
            btnSubmit.disabled = true;

            try {
                // Gọi API gửi đánh giá (Dùng chung api.js)
                const payload = {
                    rating: selectedRating,
                    feedback: feedback
                };
                
                // Endpoint giả định của Backend
                await API.post(`/customer/trip/${tripId}/rating`, payload);
                
                alert('Cảm ơn bạn đã đánh giá chuyến đi!');
                
                // Xóa tripId khỏi session vì luồng đã hoàn tất
                sessionStorage.removeItem('current_trip_id'); 
                window.location.href = 'dashboard.html';

            } catch (error) {
                console.error('Lỗi gửi đánh giá:', error);
                alert('Có lỗi xảy ra khi gửi đánh giá, vui lòng thử lại.');
                // Trả lại trạng thái nút
                btnSubmit.textContent = originalText;
                btnSubmit.disabled = false;
            }
        });
    }

    // ==========================================
    // 3. BỎ QUA ĐÁNH GIÁ
    // ==========================================
    if (btnSkip) {
        btnSkip.addEventListener('click', () => {
            // Xóa session và về thẳng trang chủ
            sessionStorage.removeItem('current_trip_id');
            window.location.href = 'dashboard.html';
        });
    }
});