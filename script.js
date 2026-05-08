document.addEventListener('DOMContentLoaded', () => {
	const nav = document.getElementById('novel-nav');
	const headers = document.querySelectorAll('h2');
	headers.forEach((h2, index) => {
		const id = 'chapter-' + index;
		h2.id = id;
		const link = document.createElement('a');
		link.href = '#' + id;
		link.textContent = h2.textContent;
		nav.appendChild(link);
	});
	const toTop = document.getElementById('to-top');
	const headerImg = document.querySelector('header img');
	const updateToTop = () => {
		const threshold = headerImg ? headerImg.getBoundingClientRect().bottom + window.scrollY : 0;
		if (window.scrollY > threshold) {
			toTop.style.display = 'flex';
		} else {
			toTop.style.display = 'none';
		}
	};
	updateToTop();
	window.addEventListener('scroll', updateToTop);
});
