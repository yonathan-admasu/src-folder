/* eslint-disable */

function subscriptionPopupOpen() {
  $('.subscription-form').css('display', 'block');
  $('.subscribe-error').css('display', 'none');
  $('.subscription-success').css('display', 'none');
  $('.subscription-container').css('display', 'block');
  $('.subscription-container input').val('');
  $('.subscription-container input').focusout();
}

function subscriptionPopupClose() {
  $('.subscription-container').css('display', 'none');
}

$('.btn-subscribe').click((e) => {
  e.preventDefault();
  var error = '';
  var data = {
    firstname : $('input#firstname').val().trim(),
    lastname : $('input#lastname').val().trim(),
    email : $('input#email').val().trim()
  }

  if (data.firstname == '' || data.lastname == '' || data.email == '') {
    error = 'Please fill in all fields';
  } else if (!data.email.includes('.') || !data.email.includes('@')) {
    error = 'Invalid email address';
  }
  
  if (error != "") {
    $('.error-text').text(error);
    $('.subscribe-error').css('display', 'block')
  } else {
    $('.subscription-form').fadeOut(500 , function() {
      $('.subscription-success').fadeIn(500)
    });
    $.ajax({
      type: "post",
      url: "/subscribe",
      data: data,
      dataType: "json",
      success: function (response) {
        console.log("Success")
      }
    });
  }

});
