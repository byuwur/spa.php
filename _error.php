<!DOCTYPE html>
<?php
/*
 * File: _error.php
 * Desc: Handles server errors. Standalone.
 * Deps: none
 * Copyright (c) 2025 Andrés Trujillo [Mateus] byUwUr
 */

// [Mateus] byUwUr --- Easy HTTP Error Page --- 2025 v5. Check out: https://github.com/byuwur/easy-http-error
$mateus_link = "https://byuwur.co";
$lang = isset($_GET["lang"]) ? $_GET["lang"] : (isset($_COOKIE["lang"]) ? $_COOKIE["lang"] : "es");
echo "<html lang='" . $lang . "' dir='ltr'>";
setcookie("lang", $lang, time() + 31536000, "/", "", false, false);
switch ($lang) {
    case "es":
    default:
        $_back = "Volver";
        $_sorry = "Lamentamos las molestias.";
        break;
    case "en":
        $_back = "Go back";
        $_sorry = "Sorry for the inconvenience.";
        break;
}
$err = isset($_GET["e"]) ? $_GET["e"] : "207";
http_response_code($err);
switch ($err) {
    case "404":
        $_estringes = "no encontrado";
        $_estringen = "page not found";
        switch ($lang) {
            case "es":
            default:
                $_emessage = "No podemos encontrar el recurso que busca.";
                break;
            case "en":
                $_emessage = "We cannot find the resource you are looking for.";
                break;
        }
        break;
    case "403":
        $_estringes = "acceso prohibido";
        $_estringen = "forbidden";
        switch ($lang) {
            case "es":
            default:
                $_emessage = "Usted no tiene permisos para acceder a este recurso.";
                break;
            case "en":
                $_emessage = "You do not have permissions to access this resource.";
                break;
        }
        break;
    case "401":
        $_estringes = "no autorizado";
        $_estringen = "unauthorized";
        switch ($lang) {
            case "es":
            default:
                $_emessage = "Es necesario autenticar para obtener una respuesta.";
                break;
            case "en":
                $_emessage = "Authentication is required to obtain a response.";
                break;
        }
        break;
    case "400":
        $_estringes = "solicitud incorrecta";
        $_estringen = "bad request";
        switch ($lang) {
            case "es":
            default:
                $_emessage = "El servidor no interpreta la solicitud por sintaxis inválida.";
                break;
            case "en":
                $_emessage = "The server cannot interpret the request by invalid syntax.";
                break;
        }
        break;
    case "500":
        $_estringes = "interno del servidor";
        $_estringen = "internal error";
        switch ($lang) {
            case "es":
            default:
                $_emessage = "El servidor está en un estado que no puede manejar.";
                break;
            case "en":
                $_emessage = "The server is in a state it cannot handle.";
                break;
        }
        break;
    case "502":
        $_estringes = "entrada incorrecta";
        $_estringen = "bad gateway";
        switch ($lang) {
            case "es":
            default:
                $_emessage = "El servidor obtuvo una respuesta inválida.";
                break;
            case "en":
                $_emessage = "The server got an invalid response.";
                break;
        }
        break;
    case "503":
        $_estringes = "servicio no disponible";
        $_estringen = "service unavailable";
        switch ($lang) {
            case "es":
            default:
                $_emessage = "El servidor no esta listo para manejar la petición.";
                break;
            case "en":
                $_emessage = "The request cannot be processed on the server.";
                break;
        }
        break;
    case "504":
        $_estringes = "tiempo de espera";
        $_estringen = "gateway timeout";
        switch ($lang) {
            case "es":
            default:
                $_emessage = "El servidor no puede obtener una respuesta a tiempo.";
                break;
            case "en":
                $_emessage = "The server cannot get a response on time.";
                break;
        }
        break;
    default:
        $_estringes = "algo salió mal";
        $_estringen = "that's not right";
        switch ($lang) {
            case "es":
            default:
                $_emessage = "La petición no puede ser procesada en el servidor.";
                break;
            case "en":
                $_emessage = "The request cannot be processed on the server.";
                break;
        }
        break;
} ?>

<head>
    <meta charset="utf-8">
    <title>ERROR <?= $_GET["e"] ?></title>
    <meta property="og:title" content="[Mateus] byUwUr" />
    <meta property="og:type" content="website" />
    <meta property="og:image" content="https://byuwur.co/img/icon.png" />
    <meta property="og:url" content="https://byuwur.co" />
    <meta property="og:site_name" content="byuwur.dev" />
    <meta property="og:description" content="Mateus' portfolio." />
    <meta http-equiv="Content-Language" content="es,en" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="Mateus' portfolio." />
    <meta name="keywords" content="[Mateus] byUwUr, byuwur.dev, producción, productora, producción audiovisual, medios, fotografía, desarrollo, software, apps, webpages, páginas web" />
    <meta name="author" content="[Mateus] byUwUr" />
    <meta name="copyright" content="[Mateus] byUwUr" />
    <meta name="theme-color" content="#300" />
    <link rel="shortcut icon" type="image/png" href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACABAMAAAAxEHz4AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAIGNIUk0AAHolAACAgwAA+f8AAIDpAAB1MAAA6mAAADqYAAAXb5JfxUYAAAAeUExURQAAAP///////////////////////////wAAAP///9TZ8SQAAAAIdFJOUwAAHEuHs8Pu/CN8IAAAAbNJREFUaN7t2T9rwlAUBfCDitDxaVvoVgdxDnTpKEKhW+uWUXDp6uY3aLaKJvZ82w5FzX3v3ReKFPxz7xTMeb+IvgzJgTtysDt4+uBh5lkkWk9UEx8YUkw5CNZ7iakEekt5mgt/vZ/YDgRw561n6QNB4l0Az/5p+r9CkFgL4DUAxh4QJDYC+AiAmQcEiUoAJL8/D0PyC3JkoiB5SUD/hQwBsprsFreDRLHf8XC9nHGAnP6ub4WJYr/j4UZUge0jACCSKPY7Hi7XAb4BAHIdKB36TABrAGhTB5jhNgVsAKCTAsa4TwEVAHRTwAwPJGufeSEAuJEJeZ2VAY3Abgw4L4B+SN5dVwAsjwWGDUD+79/A/sbDveAf/vlmMsCA0wDieQMMuFIgGAMMMMAAA84ZsKf3iwGu7FVYdOsLIPY8a4ABpwJE360LoKsmSK7ib/cF0EkD/UagnQaiDYcAkKeBUSMwSgOxlkcCrTwJxHomCUR6JgFEmi4PCJuuSwTCxrPeaiYSM7VzrfeqicRYbX3rzW4ikWm9s+iW9USpNt+i3dYTC617l/26migHSvvvNfxaYp459wOcqBZ50pQFXgAAAABJRU5ErkJggg==" />
    <link rel="icon" type="image/png" href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACABAMAAAAxEHz4AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAIGNIUk0AAHolAACAgwAA+f8AAIDpAAB1MAAA6mAAADqYAAAXb5JfxUYAAAAeUExURQAAAP///////////////////////////wAAAP///9TZ8SQAAAAIdFJOUwAAHEuHs8Pu/CN8IAAAAbNJREFUaN7t2T9rwlAUBfCDitDxaVvoVgdxDnTpKEKhW+uWUXDp6uY3aLaKJvZ82w5FzX3v3ReKFPxz7xTMeb+IvgzJgTtysDt4+uBh5lkkWk9UEx8YUkw5CNZ7iakEekt5mgt/vZ/YDgRw561n6QNB4l0Az/5p+r9CkFgL4DUAxh4QJDYC+AiAmQcEiUoAJL8/D0PyC3JkoiB5SUD/hQwBsprsFreDRLHf8XC9nHGAnP6ub4WJYr/j4UZUge0jACCSKPY7Hi7XAb4BAHIdKB36TABrAGhTB5jhNgVsAKCTAsa4TwEVAHRTwAwPJGufeSEAuJEJeZ2VAY3Abgw4L4B+SN5dVwAsjwWGDUD+79/A/sbDveAf/vlmMsCA0wDieQMMuFIgGAMMMMAAA84ZsKf3iwGu7FVYdOsLIPY8a4ABpwJE360LoKsmSK7ib/cF0EkD/UagnQaiDYcAkKeBUSMwSgOxlkcCrTwJxHomCUR6JgFEmi4PCJuuSwTCxrPeaiYSM7VzrfeqicRYbX3rzW4ikWm9s+iW9USpNt+i3dYTC617l/26migHSvvvNfxaYp459wOcqBZ50pQFXgAAAABJRU5ErkJggg==" />
    <style>
        * {
            font-family: "Lucida Console", Courier, monospace;
            -webkit-transition: .25s !important;
            -o-transition: .25s !important;
            -ms-transition: .25s !important;
            -moz-transition: .25s !important;
            transition: .25s !important
        }

        body {
            margin: 0
        }

        #body {
            background: linear-gradient(90deg, #311 25%, #111 100%);
            width: 100vw;
            height: 100vh
        }

        #cubes,
        #message-box {
            color: #fff;
            position: absolute;
            width: 50vw;
            height: 100vh;
            top: 0
        }

        #cubes {
            left: 5%
        }

        #message-box {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            left: 45%
        }

        #message-box a {
            color: #fff;
            font-size: 16px;
            margin: 8px 0 24px
        }

        #message-box span {
            font-size: 16px;
            margin-bottom: 4px
        }

        #message-box h1 {
            font-size: 192px;
            margin: 0;
            line-height: 1
        }

        #message-box p {
            font-size: 40px;
            margin: 4px;
            line-height: 1
        }

        #action-link-wrap {
            margin: 32px 0
        }

        #action-link-wrap a {
            background: #600;
            font-size: 20px;
            margin: 0 4px;
            padding: 12px 24px;
            border-radius: 4px;
            font-weight: 700;
            cursor: pointer;
            text-decoration: none;
            text-transform: uppercase
        }

        #action-link-wrap a:hover {
            background: #900
        }

        #poly1,
        #poly2,
        #poly3,
        #poly4,
        #poly5 {
            animation: 2.5s ease-in-out infinite alternate floatCubes
        }

        #poly2 {
            animation-delay: .25s
        }

        #poly3 {
            animation-delay: .5s
        }

        #poly4 {
            animation-delay: .75s
        }

        #poly5 {
            animation-delay: 1s
        }

        @keyframes floatCubes {
            100% {
                transform: translateY(24px)
            }
        }

        @media (max-width:880px) {

            #cubes,
            #message-box {
                width: 100vw;
                left: 0
            }
        }
    </style>
    <script>
        window.addEventListener("popstate", function(e) {
            window.location.reload();
        });
    </script>
</head>

<body>
    <!-- [Mateus] byUwUr --- Easy HTTP Error Page --- 2025 v5. Check out: https://github.com/byuwur/easy-http-error -->
    <div id="body">
        <svg id="cubes" viewBox="0 0 837 1045" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:sketch="http://www.bohemiancoding.com/sketch/ns">
            <g id="page1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" sketch:type="MSPage">
                <path d="M353,9 L626.664028,170 L626.664028,487 L353,642 L79.3359724,487 L79.3359724,170 L353,9 Z" id="poly1" stroke="#600" stroke-width="20" sketch:type="MSShapeGroup"></path>
                <path d="M78.5,529 L147,569.186414 L147,648.311216 L78.5,687 L10,648.311216 L10,569.186414 L78.5,529 Z" id="poly2" stroke="#777" stroke-width="16" sketch:type="MSShapeGroup"></path>
                <path d="M773,186 L827,217.538705 L827,279.636651 L773,310 L719,279.636651 L719,217.538705 L773,186 Z" id="poly3" stroke="#FFF" stroke-width="16" sketch:type="MSShapeGroup"></path>
                <path d="M639,529 L773,607.846761 L773,763.091627 L639,839 L505,763.091627 L505,607.846761 L639,529 Z" id="poly4" stroke="#000" stroke-width="24" sketch:type="MSShapeGroup"></path>
                <path d="M281,751 L383,811.025276 L383,929.21169 L281,987 L179,929.21169 L179,811.025276 L281,751 Z" id="poly5" stroke="#555" stroke-width="16" sketch:type="MSShapeGroup"></path>
            </g>
        </svg>
        <div id="message-box">
            <img width="auto" height="16px" alt="colombia" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAMBAMAAACZySCyAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAHlBMVEX80Rb+0hXevyUeSoQAN5UZM4a1FjPQESXOESb///+0ItUCAAAAAWJLR0QJ8dml7AAAAAd0SU1FB+MKCAoDMaRkJe0AAAASSURBVAjXY2AgDBgFoQwWyhgAGaAApiKVHiIAAAAldEVYdGRhdGU6Y3JlYXRlADIwMTktMTAtMDhUMTA6MDM6MDYrMDA6MDDXjtZJAAAAJXRFWHRkYXRlOm1vZGlmeQAyMDE5LTEwLTA4VDEwOjAzOjA2KzAwOjAwptNu9QAAAABJRU5ErkJggg==" />
            <img width="auto" height="140px" alt="logo" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAABJmlDQ1BBZG9iZSBSR0IgKDE5OTgpAAAoz2NgYDJwdHFyZRJgYMjNKykKcndSiIiMUmA/z8DGwMwABonJxQWOAQE+IHZefl4qAwb4do2BEURf1gWZxUAa4EouKCoB0n+A2CgltTiZgYHRAMjOLi8pAIozzgGyRZKywewNIHZRSJAzkH0EyOZLh7CvgNhJEPYTELsI6Akg+wtIfTqYzcQBNgfClgGxS1IrQPYyOOcXVBZlpmeUKBhaWloqOKbkJ6UqBFcWl6TmFit45iXnFxXkFyWWpKYA1ULcBwaCEIWgENMAarTQZKAyAMUDhPU5EBy+jGJnEGIIkFxaVAZlMjIZE+YjzJgjwcDgv5SBgeUPQsykl4FhgQ4DA/9UhJiaIQODgD4Dw745AMDGT/0ZOjZcAAAACXBIWXMAAAsTAAALEwEAmpwYAAAFyGlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDggNzkuMTY0MDM2LCAyMDE5LzA4LzEzLTAxOjA2OjU3ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlRXZlbnQjIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgMjEuMSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIwLTA3LTAyVDEwOjExOjUxLTA1OjAwIiB4bXA6TWV0YWRhdGFEYXRlPSIyMDIwLTA3LTAyVDEwOjExOjUxLTA1OjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyMC0wNy0wMlQxMDoxMTo1MS0wNTowMCIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo1NTM5NzQwMS04Nzc1LWRlNDItYjg4My04OGY0M2JkNzEwNDMiIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDo2NTcxZTI3NS0wZWM4LTRhNDItYmI4My0yZTM2OTJiYjdmM2IiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDo0ZGEyODExMC00OGZkLTNmNDktYTYyMS1lYTk1YmU1NjhmZTUiIGRjOmZvcm1hdD0iaW1hZ2UvcG5nIiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIj4gPHhtcE1NOkhpc3Rvcnk+IDxyZGY6U2VxPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iY3JlYXRlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDo0ZGEyODExMC00OGZkLTNmNDktYTYyMS1lYTk1YmU1NjhmZTUiIHN0RXZ0OndoZW49IjIwMjAtMDctMDJUMTA6MTE6NTEtMDU6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCAyMS4xIChXaW5kb3dzKSIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6NTUzOTc0MDEtODc3NS1kZTQyLWI4ODMtODhmNDNiZDcxMDQzIiBzdEV2dDp3aGVuPSIyMDIwLTA3LTAyVDEwOjExOjUxLTA1OjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgMjEuMSAoV2luZG93cykiIHN0RXZ0OmNoYW5nZWQ9Ii8iLz4gPC9yZGY6U2VxPiA8L3htcE1NOkhpc3Rvcnk+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+eXBkCQAAFEBJREFUeNrtnQeUVEUWhkFJHolKEhQRkCRhWN0FyShmSQICihFBQDGgIqIgSQExc1RWl7SgooAIiKIiJgygosICgsJZQTGhKKuYra2vztw5Na/f6+nued3T3VN1zj3DAP1edd2vbv331uuuEkqpEs6KrxX8H7Kz1dc2Rdsibau0zdTWLxvfqAMgf2urbQnjglWqVElVr15dlSpVSuX+3X+0DdVW1gGQXQAcr22xOL58+fKqXr16qnnz5ionJ0c1btxY1ahRQx100EECwi5tgx0AmQ/A37TNE8dXrFhR1a1b1zi+SZMmxulVq1ZVxxxzjAGhYcOGqlq1anZE2KLtcgdA5rV22h4Xx1euXNk4vkWLFqpp06bGybVr11Znn322GjhwoDruuOPM/yEqtGzZMi8ilC5dWkD4UNu12ko6ANK7NdS2wA71Rx99tHEqMx7H16pVS5144onqiiuuUPfcc4+6//771S233KJ69OhhIsBhhx2W9xpAIEJYS8M2bQMcAOnXOmp7wi/UM7sReji+c+fO6sorr1TTp083huPHjBmjJk+erO6991518803q3POOcdECVkaAAEwiAjW0rApVyyWcQAUbatnO94WdxLqcX7Hjh3V1Vdfre68807j+LFjxxpnA4AYvwsIEyZMUL1791b169dXhx9+eB4IPmJxt7aBDoDUtxw71FeoUMGEbdvxrPE4/vLLL8+b8X6O9xr/PmnSJHX33XfnRYRGjRqZpYGoImKRCGFFhI3ahjsAkt/aa3vMzuO9of6II45QXbp0USNGjDAzHovF8X4g3HbbbSYi8Hu/fv2MjrDFImAQEQ4++GC7jjBMWykHQLitqbY54vhDDz00QtzVrFlTtW3bVg0fPtzM3jvuuCMhx/uBwNJw3333met169YtX0QQEOiDtTR8nC5iMdMBON7O4wn19owXVc+Mx/E4XcRdYR3vNVss8nuvXr0MfCwFEhFYGohCVvq4QdsQB0D8rba2J23HI8Qkj2eQCb3t27c3of6uu+4yoX7cuHGhOz4oIpBCjh8/XvXp08f0jYggYlGikhURtmu70AEQW6ifpe1XcXydOnUiZjyOHzp0aFziLhkgiFi86aabTERgKahSpUre0iCV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" />
            <a href="<?= $mateus_link ?>">[Mateus] byUwUr</a>
            <span>ERROR</span>
            <h1><?= $err ?></h1>
            <p><?= $_estringes ?></p>
            <p><?= $_estringen ?></p>
            <br>
            <span><?= $_emessage ?></span>
            <span><?= $_sorry ?></span>
            <div id="action-link-wrap">
                <a onclick="history.back(-1)"><?= $_back ?></a>
            </div>
            <span><?= isset($_POST["custom_error_message"]) ? "System error:<br>{$_POST["custom_error_message"]}" : "" ?></span>
        </div>
    </div>
</body>

</html>