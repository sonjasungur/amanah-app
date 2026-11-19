#!/usr/bin/env python3
"""Route policy for the shared Caddy: reads its JSON configuration on stdin.

Allowed for Amanah is one thing only: the staging host, behind a password, to the staging upstream.
Prints "ok", or reason codes without configuration values, and exits 1. Unreadable input is a failure:
a check that cannot see the configuration must not report a closed route.

  caddy-route-policy.py [denied-address ...]   addresses no route may dial, such as the production app's IP
"""
import json
import sys

STAGING_HOST = "amanah-test.mscisystems.com"
STAGING_UPSTREAM = "amanah-staging-app:3000"
PRODUCTION_PORT = ":3001"


def strings(node):
    if isinstance(node, dict):
        for key, value in node.items():
            yield key
            yield from strings(value)
    elif isinstance(node, list):
        for value in node:
            yield from strings(value)
    elif isinstance(node, str):
        yield node


def conditions(route):
    """The hosts a route is limited to, and whether anything else limits it."""
    hosts, limited = [], False
    for match in route.get("match", []):
        hosts += [host.lower() for host in match.get("host", [])]
        limited = limited or any(key != "host" for key in match)
    return hosts, limited


def proxies(routes, hosts=frozenset(), protected=False):
    """Every reverse_proxy with its hosts, and whether a password check always runs before it."""
    for route in routes:
        own_hosts, limited = conditions(route)
        route_hosts = frozenset(own_hosts) or hosts
        guarded = protected
        for handler in route.get("handle", []):
            kind = handler.get("handler")
            if kind == "authentication":
                guarded = True
            elif kind == "reverse_proxy":
                yield route_hosts, handler, guarded
            elif kind == "subroute":
                yield from proxies(handler.get("routes", []), route_hosts, guarded)
        # A password check behind a matcher protects only what that matcher selects.
        if not limited and not own_hosts:
            protected = guarded


def all_hosts(node):
    if isinstance(node, dict):
        for host in node.get("host", []) if isinstance(node.get("host"), list) else []:
            if isinstance(host, str):
                yield host.lower()
        for value in node.values():
            yield from all_hosts(value)
    elif isinstance(node, list):
        for value in node:
            yield from all_hosts(value)


def violations(config, denied=()):
    try:
        servers = config["apps"]["http"]["servers"]
        routes = [route for server in servers.values() for route in server["routes"]]
    except (KeyError, TypeError, AttributeError):
        return {"config-unreadable"}
    if not routes:
        return {"config-unreadable"}

    found = set()
    for host in all_hosts(servers):
        if "amanah" in host and host != STAGING_HOST:
            found.add("amanah-host")

    for hosts, proxy, guarded in proxies(routes):
        dials = [upstream.get("dial", "") for upstream in proxy.get("upstreams", [])]
        if hosts == {STAGING_HOST}:
            if not dials or set(dials) != {STAGING_UPSTREAM}:
                found.add("staging-wrong-upstream")
            if not guarded:
                found.add("staging-without-password")
        else:
            for dial in dials:
                low = dial.lower()
                if low == STAGING_UPSTREAM or "amanah" in low or low.endswith(PRODUCTION_PORT):
                    found.add("foreign-host-to-amanah")
        if any(dial.rsplit(":", 1)[0] in denied for dial in dials):
            found.add("denied-address")

    # Anything else naming Amanah, such as a redirect or a certificate policy for the old domain.
    for text in strings(config):
        rest = text.lower().replace(STAGING_HOST, "").replace(STAGING_UPSTREAM, "")
        if "amanah" in rest:
            found.add("amanah-mention")
    return found


def main():
    try:
        config = json.load(sys.stdin)
    except ValueError:
        config = None
    found = violations(config, frozenset(sys.argv[1:]))
    print(" ".join(sorted(found)) if found else "ok")
    return 1 if found else 0


if __name__ == "__main__":
    sys.exit(main())
