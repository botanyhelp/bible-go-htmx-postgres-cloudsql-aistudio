# Multi-stage Build Dockerfile for Go Scriptures Web Server
FROM golang:1.22-alpine AS builder

WORKDIR /app

# Download dependencies
COPY go.mod ./
RUN go mod download

# Copy source code and build statically linked binary
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o scriptures-server .

# Final minimal runtime image
FROM alpine:3.19

RUN apk add --no-cache ca-certificates tzdata
WORKDIR /app

COPY --from=builder /app/scriptures-server .

EXPOSE 3000
ENV PORT=3000

USER nobody:nobody

ENTRYPOINT ["./scriptures-server"]
