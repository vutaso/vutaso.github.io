// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Hamburger Menu Toggle
const hamburgerMenu = document.querySelector('.hamburger-menu');
const navLinks = document.querySelector('.nav-links');

if (hamburgerMenu) {
    hamburgerMenu.addEventListener('click', function () {
        this.classList.toggle('active');

        // Dynamically set max-height based on content
        if (navLinks.classList.contains('active')) {
            navLinks.style.maxHeight = '0';
            navLinks.classList.remove('active');
        } else {
            navLinks.classList.add('active');
            navLinks.style.maxHeight = navLinks.scrollHeight + 'px';
        }
    });

    // Close menu when clicking on a link
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', function () {
            hamburgerMenu.classList.remove('active');
            navLinks.classList.remove('active');
            navLinks.style.maxHeight = '0';
        });
    });
}

// FAQ Accordion
document.querySelectorAll('.faq-question').forEach(button => {
    button.addEventListener('click', function () {
        const answer = this.nextElementSibling;
        const isOpen = answer.classList.contains('open');

        // Close all other FAQs
        document.querySelectorAll('.faq-answer').forEach(item => {
            item.classList.remove('open');
        });
        document.querySelectorAll('.faq-question').forEach(item => {
            item.classList.remove('active');
        });

        // Toggle current FAQ
        if (!isOpen) {
            answer.classList.add('open');
            this.classList.add('active');
        }
    });
});
