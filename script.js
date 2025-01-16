document.getElementById("fetchButton").addEventListener("click", function () {
  const username = document.getElementById("username").value;
  const errorMessageDiv = document.getElementById("error-message");
  errorMessageDiv.textContent = ""; // Clear previous error messages
  if (username) {
    fetch(`https://api.github.com/users/${username}/repos`)
      .then((response) => response.json())
      .then((data) => {
        const resultsDiv = document.getElementById("results");
        resultsDiv.innerHTML = "";
        data.forEach((repo) => {
          const repoDiv = document.createElement("div");
          repoDiv.classList.add("repo");

          // Fetch languages for each repository
          fetch(repo.languages_url)
            .then((response) => response.json())
            .then((languages) => {
              // Filter out unwanted keys
              const filteredLanguages = Object.keys(languages).filter(
                (key) => key !== "message" && key !== "documentation_url"
              );
              const languagesList = filteredLanguages.join(", ") || "N/A";

              repoDiv.innerHTML = `
                <h2>${repo.name}</h2>
                <p>${repo.description || "No description available"}</p>
                <p class="topics">Topics: ${
                  repo.topics.join(", ") || "No topics available"
                }</p>
                <p class="languages">Languages: ${
                  repo.language || "N/A"
                } (Primary), ${languagesList}</p>
                <p class="size">Size: ${repo.size} KB</p>
                <p class="date">Created on: ${new Date(
                  repo.created_at
                ).toLocaleDateString()}</p>
                <p class="date">Last updated on: ${new Date(
                  repo.updated_at
                ).toLocaleDateString()}</p>
              `;
              resultsDiv.appendChild(repoDiv);
            })
            .catch((error) => {
              console.error("Error fetching languages:", error);
            });
        });
      })
      .catch((error) => {
        console.error("Error fetching repositories:", error);
        errorMessageDiv.textContent =
          "Failed to fetch repositories. Please try again.";
      });
  } else {
    errorMessageDiv.textContent = "Please enter a GitHub username.";
  }
});

document.getElementById("themeToggle").addEventListener("click", function () {
  const body = document.body;
  body.classList.toggle("light-mode");
  const isLightMode = body.classList.contains("light-mode");
  this.textContent = isLightMode ? "🌞" : "🌙";
});
