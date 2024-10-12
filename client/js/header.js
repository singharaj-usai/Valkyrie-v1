document.addEventListener('DOMContentLoaded', function () {
  fetch('/html/components/header.html')
    .then((response) => response.text())
    .then((data) => {
      document.head.innerHTML = data;
    })
    .catch((error) => console.error('Error loading head component:', error));
});
