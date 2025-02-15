# byuwur/easy-spa-php

**byUwUr's Easy PHP SPA Framework**

Test it out at: [byuwur.co/\_spa.php/](https://byuwur.co/_spa.php/)

## What's this about?

This project is a simple, easy-to-use framework for building single-page applications (SPAs) using PHP. It provides a structure for handling routing, modals, and basic operations required for an SPA. The framework is designed to be lightweight and easy to integrate into existing projects.

## What does it do?

-   **Client-Side Routing:** Use PHP to manage SPA routes, supporting both GET and POST methods.
-   **Bootstrap Integration:** Easily create modals with custom content, titles, and behaviors.
-   **Local Storage Management:** Automatically saves and retrieves necessary variables using the browser's local storage.
-   **AJAX Support:** Built-in support for making AJAX requests to load content dynamically without full page reloads thanks to jQuery.
-   **Custom Error Handling:** Set up custom error pages for various HTTP status codes.

## How is it done?

### Core Files [in priority order]

-   **.htaccess:** Apache configuration file that handles URL rewriting, directs requests to the main `home.php` entry point, and configures custom error pages.
-   **nginx.conf:** Example nginx configuration file. For more details visit `https://github.com/byuwur/nginx-configurations`
-   **.env.example:** Environment file that contains credentials and cofigurations.
-   **\_spa.js:** Contains the main JavaScript functions for managing the SPA's frontend logic.
-   **home.php:** The main entry point of the SPA. Loads resources and handles the basic layout of the application.
-   **\_var.php:** Essential configuration file that sets up environment variables and paths used throughout the application.
-   **\_common.php:** Configuration file that initializes common project-wide variables.
-   **\_functions.php:** Contains a set of utility functions used across the application, including API responses, HTTP requests, data validation, data sanitization, and other general-purpose functions.
-   **\_plugins.php:** Handles the initialization and inclusion of essential composer libraries.
-   **\_config.php:** Configures the databases connections (uses $\_ENV), provides error handling for connection failures.
-   **\_routes.php:** Defines all routes within the application, mapping URIs to specific PHP files and components.
-   **\_router.php:** Resolves incoming URIs to the correct routes defined in `_routes.php`, handling dynamic parameters and generating the necessary GET and POST data for each route.

### Additional Files

-   **\_auth.php:** Manages basic user authentication with login, logout, and session validation.
-   **\_functions.js:** Contains general-purpose functions used across different parts of the application.
-   **\_common.css:** CSS file that styles common UI elements.
-   **\_common.js:** JavaScript file that initializes common UI elements.
-   **\_error.php:** File rendered when SPA throws an error.

### Public Assets

-   **css/**: Contains all style files. (This project uses Bootstrap 5.3)
-   **js/**: Contains all script files. (This project uses Bootstrap 5.3 and jQuery 3.3)
-   **img/**: Contains all image resources.

## Installation

1. Clone the repository to your local machine.
2. Ensure your web server has PHP installed.
3. Update the `.htaccess` or `nginx.conf` file to match your server configuration.
4. Configure your environment variables in the `.env` file using `.env.example`.

## Usage

1. Define your routes in the `_routes.php` file.
2. Use the routing system to manage your SPA's navigation.
3. Add custom functionality by creating new PHP files and adding them to the routes.
4. Navigate. Suit yourself.

## License

MIT (c) Andrés Trujillo [Mateus] byUwUr
