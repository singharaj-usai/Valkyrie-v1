# Use Node 18 base image
FROM node:18

# Set the working directory
WORKDIR /var/www

# Copy the package.json and package-lock.json first
COPY package.json package-lock.json /var/www/

# Install dependencies
RUN npm install

# Add group and user 'www'
RUN groupadd -g 1002 www && useradd -u 1002 -ms /bin/bash -g www www

# Copy the rest of the application code and set ownership to the www user
COPY --chown=www:www . /var/www

# Switch to 'www' user
USER www

# Expose the application port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
