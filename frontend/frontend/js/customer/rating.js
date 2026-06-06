/**
 * js/customer/rating.js
 * Xử lý đánh giá chuyến đi (chọn sao, gửi feedback về backend).
 */

document.addEventListener('DOMContentLoaded', () => {
    const starContainer = document.getElementById('star-rating-container');
    const stars = document.querySelectorAll('.star-rating__star');
    const btnSubmit = document.getElementById('btn-submit-rating');
    const btnSkip = document.getElementById('btn-skip-rating');
    const feedbackInput = document.getElementById('rating-feedback');

    if (!starContainer) return;

    // Tải thông tin tài xế thực tế từ chuyến đi để hiển thị lên màn hình đánh giá
    async function loadDriverInfo() {
        const tripId = sessionStorage.getItem('current_trip_id');
        if (!tripId) return;

        try {
            const data = await API.get(`/customer/trip/${tripId}`);
            if (data.success && data.driver) {
                const driverNameEl = document.getElementById('rating-driver-name');
                if (driverNameEl) {
                    driverNameEl.textContent = data.driver.ten || 'Tài xế';
                }
            }
        } catch (error) {
            console.error('Lỗi tải thông tin tài xế cho màn hình đánh giá:', error);
        }
    }

    loadDriverInfo();

    let selectedRating = 5;

    function highlightStars(count) {
        stars.forEach(star => {
            const val = parseInt(star.getAttribute('data-value'));
            star.textContent = val <= count ? '★' : '☆';
            star.style.color = val <= count ? 'var(--color-yellow)' : 'var(--color-gray-300)';
            star.style.fontSize = '2.5rem';
            star.style.transition = 'color 0.2s';
        });
    }

    highlightStars(selectedRating);

    stars.forEach(star => {
        star.addEventListener('mouseover', function() { highlightStars(parseInt(this.getAttribute('data-value'))); });
        star.addEventListener('mouseout',  function() { highlightStars(selectedRating); });
        star.addEventListener('click',     function() { selectedRating = parseInt(this.getAttribute('data-value')); highlightStars(selectedRating); });
    });

    if (btnSubmit) {
        btnSubmit.addEventListener('click', async () => {
            const tripId = sessionStorage.getItem('current_trip_id');
            if (!tripId) {
                alert('Không tìm thấy thông tin chuyến đi! Đang quay lại trang chủ.');
                window.location.href = 'dashboard.html';
                return;
            }

            const originalText = btnSubmit.textContent;
            btnSubmit.textContent = 'Đang gửi...';
            btnSubmit.disabled = true;

            try {
                // FIX: endpoint đúng là /customer/rating (không phải /customer/trip/:id/rating)
                await API.post('/customer/rating', {
                    ma_chuyen_di: parseInt(tripId),
                    so_sao: selectedRating,
                    nhan_xet: feedbackInput ? feedbackInput.value.trim() : ''
                });

                alert('Cảm ơn bạn đã đánh giá chuyến đi!');
                sessionStorage.removeItem('current_trip_id');
                window.location.href = 'dashboard.html';
            } catch (error) {
                console.error('Lỗi gửi đánh giá:', error);
                alert('Có lỗi xảy ra khi gửi đánh giá, vui lòng thử lại.');
                btnSubmit.textContent = originalText;
                btnSubmit.disabled = false;
            }
        });
    }

    if (btnSkip) {
        btnSkip.addEventListener('click', () => {
            sessionStorage.removeItem('current_trip_id');
            window.location.href = 'dashboard.html';
        });
    }
});
