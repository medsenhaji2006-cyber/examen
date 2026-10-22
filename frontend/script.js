fetch('http://localhost:5500/')
    .then(response => response.text())
    .then(data => {
        console.log("Réponse du backend :", data);
    })
    .catch(error => {
        console.error("Erreur :", error);
    });