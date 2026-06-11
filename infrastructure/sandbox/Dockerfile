FROM python:3.12-slim

RUN useradd --uid 10000 --no-create-home --shell /bin/false runner

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

RUN mkdir /sandbox && chown runner:runner /sandbox

USER runner
WORKDIR /sandbox

ENTRYPOINT ["/entrypoint.sh"]