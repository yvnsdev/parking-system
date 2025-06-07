# Usa la imagen oficial de PHP con Apache
FROM php:8.2-apache

# Instala extensiones de PHP necesarias para PostgreSQL
RUN apt-get update && \
    apt-get install -y libpq-dev && \
    docker-php-ext-install pdo pdo_pgsql

# Habilita mod_rewrite de Apache
RUN a2enmod rewrite

# Copia la configuración personalizada de Apache
COPY apache-config.conf /etc/apache2/sites-available/000-default.conf

# Copia los archivos de la aplicación
COPY ../app /var/www/html

# Establece los permisos adecuados
RUN chown -R www-data:www-data /var/www/html && \
    chmod -R 755 /var/www/html

# Puerto expuesto
EXPOSE 80

# Comando de inicio
CMD ["apache2-foreground"]