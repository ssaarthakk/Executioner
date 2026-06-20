FROM python:3.12-slim

RUN groupadd -g 10000 runner && \
    useradd  -u 10000 -g runner -s /bin/false -M runner

RUN apt-get update && \
    apt-get install -y --no-install-recommends procps && \
    rm -rf /var/lib/apt/lists/*

# RUN pip install --no-cache-dir \
#     numpy pandas requests flask

RUN mkdir /sandbox && chown runner:runner /sandbox

USER runner
WORKDIR /sandbox

CMD ["sleep", "infinity"]