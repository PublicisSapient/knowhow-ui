# Use a base image
FROM psknowhow/nginx:1.22.1-alpine-slim

RUN apk add openssl --no-cache \
    && apk add curl --no-cache 

# Set environment variable
ENV PID_LOC="/run/nginx" \
    CONF_LOC="/etc/nginx" \
    HTML_LOC="/var/lib/nginx/" \
    UI2_LOC="/var/lib/nginx/ui2" \
    START_SCRIPT_LOC="/etc/init.d" \
    UI2_ASSETS_ARCHIVE="ui2.tar" \
    ERRORPAGE_ASSETS_ARCHIVE="ErrorPage.tar" \
    ASSETS_ARCHIVE="*.tar" \
    CERT_LOC="/etc/ssl/certs" \
    PROTOCOL="http"

# Create necessary directories
RUN mkdir -p ${PID_LOC} ${UI2_LOC}
RUN rm -f ${CONF_LOC}/nginx.conf ${CONF_LOC}/conf.d/default.conf ${HTML_LOC}index.html

# Copy files
COPY nginx/files/nginx_https.conf /tmp/nginx_https.conf
COPY nginx/files/nginx_http.conf /tmp/nginx_http.conf
COPY nginx/files/${ASSETS_ARCHIVE} ${HTML_LOC}
COPY nginx/scripts/start_nginx.sh ${START_SCRIPT_LOC}/start_nginx.sh
COPY nginx/files/certs/* ${CERT_LOC}/

# Extract assets
RUN tar xvf ${HTML_LOC}${UI2_ASSETS_ARCHIVE} -C ${UI2_LOC} && tar xvf ${HTML_LOC}${ERRORPAGE_ASSETS_ARCHIVE} -C ${UI2_LOC} \
    && chmod +x ${START_SCRIPT_LOC}/start_nginx.sh && rm -f ${HTML_LOC}${ASSETS_ARCHIVE}

# Expose ports
EXPOSE 80 443

# Entrypoint command
ENTRYPOINT ["/etc/init.d/start_nginx.sh"]