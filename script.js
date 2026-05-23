document.addEventListener('DOMContentLoaded', () => {
	// ローカル表示の判定
	const hostname = window.location.hostname;
	const protocol = window.location.protocol;
	const isDevelopment =
		protocol === 'file:' ||
		hostname === 'localhost' ||
		hostname === '127.0.0.1';
	if (isDevelopment) {
		document.body.style.backgroundColor = '#e8f4fb';
	}

	// 目次の生成
	const nav = document.getElementById('novel-nav');
	const headers = document.querySelectorAll('h2');
	headers.forEach((h2, index) => {
		if (h2.textContent.trim() === 'プロローグ') return;
		const id = 'chapter-' + index;
		h2.id = id;
		const link = document.createElement('a');
		link.href = '#' + id;
		link.textContent = h2.textContent;
		nav.appendChild(link);
	});
	
	// トップへ戻るボタンの表示制御
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

	// 現在の章を右上に表示
	const chapterIndicator = document.createElement('div');
	chapterIndicator.id = 'chapter-indicator';
	document.body.appendChild(chapterIndicator);
	const updateChapter = () => {
		let current = null;
		headers.forEach((h2) => {
			if (h2.getBoundingClientRect().top <= 40) {
				current = h2;
			}
		});
		if (current) {
			const title = current.nextElementSibling ? current.nextElementSibling.textContent.trim() : '';
			const chapter = current.textContent.trim();
			chapterIndicator.textContent = title && title !== '\u00a0' ? chapter + '\u3000' + title : chapter;
			chapterIndicator.style.display = 'block';
		} else {
			chapterIndicator.style.display = 'none';
		}
	};
	updateChapter();
	window.addEventListener('scroll', updateChapter);
});
