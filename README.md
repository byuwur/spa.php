# byuwur/spa.php

**byUwUr's Easy PHP SPA Framework**

Test it out at: [byuwur.co/spa.php/](https://byuwur.co/spa.php/)

## What's this about?

This project is a simple, easy-to-use framework for building single-page applications (SPAs) using PHP. It provides a structure for handling routing, modals, and basic operations required for an SPA. The framework is designed to be lightweight and easy to integrate into existing projects.

**[NEW!]** Try use this repository as a git submodule: See how it's used at [github.com/byuwur/byuwur.github.io](https://github.com/byuwur/byuwur.github.io). Easier than a package, because sometimes you don't need a package.

## What does it do?

-   **Client-Side Routing:** Use PHP to manage SPA routes, supporting both GET and POST methods.
-   **Compatible:** Add everything you want on top of it. It's meant to be flexible for you.
-   **Local Storage Management:** Automatically saves and retrieves necessary variables using the browser's local storage.
-   **Bootstrap Integration:** Easily create modals with custom content, titles, and behaviors.
-   **AJAX Support:** Built-in support for making AJAX requests to load content dynamically without full page reloads thanks to jQuery.
-   **Custom Error Handling:** Set up custom error pages for various HTTP status codes.

## How is it done?

### Core Files [in priority order]

-   **.htaccess:** _(root)_ Apache configuration file that handles URL rewriting, directs requests to the main `home.php` entry point, and configures custom error pages. [This file MUST be duplicated to the root]
-   **nginx.conf:** _(root)_ Example nginx configuration file. For more details visit `https://github.com/byuwur/nginx-configurations`
-   **\_var.php:** _(root)_ Essential configuration file that sets up environment variables and paths used throughout the application. [This file MUST be duplicated to the root]
-   **\_spa.js:** Contains the main JavaScript functions for managing the SPA's frontend logic.
-   **\_router.php:** Resolves incoming URIs to the correct routes defined in `_routes.php`, handling dynamic parameters and generating the necessary GET and POST data for each route.
-   **\_routes.php:** _(main)_ Defines all routes within the application, mapping URIs to specific PHP files and components.
-   **.env:** _(root)_ Environment file that contains credentials and cofigurations.
-   **home.php:** _(root)_ The main entry point of the SPA. Loads resources and handles the basic layout of the application.
-   **\_plugins.php:** _(main)_ Handles the initialization and inclusion of essential composer libraries.
-   **\_config.php:** _(main)_ Configures the databases connections (uses $\_ENV), provides error handling for connection failures.

**[NEW!]** When this repository is used as a submodule: the "(root)" files are mandatory to be referenced in the root of the project; the "(main)" files are not required to be on the root of the project but are better handled there.

### Additional Files

-   **\_auth.php:** Manages basic user authentication with login, logout, and session validation.
-   **\_functions.php:** Contains a set of utility functions used across the application, including API responses, HTTP requests, data validation, data sanitization, and other general-purpose functions.
-   **\_functions.js:** Contains general-purpose functions used across different parts of the application.
-   **\_common.php:** Configuration file that initializes common project-wide variables.
-   **\_common.js:** JavaScript file that initializes common UI elements.
-   **\_common.css:** CSS file that styles common UI elements.
-   **\_error.php:** File rendered when SPA throws an error.

### Public Assets

-   **css/**: Contains all style files. (This project uses Bootstrap 5.3)
-   **js/**: Contains all script files. (This project uses Bootstrap 5.3 and jQuery 4)
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

## Some other things I've made and used here

-   [easy-http-error](https://github.com/byuwur/easy-http-error) - Custom error page with server configurations.
-   [easy-sidebar-bootstrap](https://github.com/byuwur/easy-sidebar-bootstrap) - Sidebar component using Bootstrap and jQuery.

## License

MIT (c) Andrés Trujillo [Mateus] byUwUr
