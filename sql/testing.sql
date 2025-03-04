-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1:3306
-- Tiempo de generación: 28-10-2023 a las 06:25:29
-- Versión del servidor: 8.0.27
-- Versión de PHP: 8.1.0
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";
/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */
;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */
;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */
;
/*!40101 SET NAMES utf8mb4 */
;
--
-- Base de datos: `testing`
--
-- --------------------------------------------------------
--
-- Estructura de tabla para la tabla `test`
--
DROP TABLE IF EXISTS `test`;
CREATE TABLE IF NOT EXISTS `test` (
    `ID` int NOT NULL,
    `NAME` varchar(45) NOT NULL,
    `VALUE` varchar(45) DEFAULT NULL,
    PRIMARY KEY (`ID`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb3;
--
-- Volcado de datos para la tabla `test`
--
INSERT INTO `test` (`ID`, `NAME`, `VALUE`)
VALUES (1, 'Sample 1', '10'),
    (2, 'Sample 2', '20'),
    (3, 'Sample 3', '30'),
    (4, 'Sample 4', '40'),
    (5, 'Sample 5', '50');
COMMIT;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */
;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */
;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */
;