/* eslint-disable prefer-arrow-callback */
$(document).ready(function (e) {
  $('.form-group.with-icon input').focusout(function (e) {
    e.preventDefault();
    if ($(this).val() != '') {
      $(this).addClass('filled');
    } else {
      $(this).removeClass('filled');
    }
  });

  $('.advsearch-btn.btn-reset').click(function (e) {
    $('.advsearch-form .advsearch-select').val('');
  });

  $('.advsearch-form').on('click touchstart', '#btn-get-judge-profile', function (e) {
    e.preventDefault();
    console.log('Button clicked...');
    const slug = $(this).parent().find('select').val();
    if (slug !== '') {
      window.location.href = '/judicial-profile/' + slug;
    }
    return false;
  });
});

// When the user scrolls down 20px from the top of the document, show the button
// window.onscroll = function () { scrollFunction(); };

// function scrollFunction() {
// if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
// document.querySelector('.st-button').style.display = 'block';
// } else {
// document.querySelector('.st-button').style.display = 'none';
// }
// }

// When the user clicks on the button, scroll to the top of the document
// function topFunction() {
// document.body.scrollTop = 0; // For Safari
// document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
// }
