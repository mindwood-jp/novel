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
});
