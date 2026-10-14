package com.eventmanagement.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/** Serves the React entry point when a client-side route is opened directly. */
@Controller
public class FrontendController {
    @GetMapping({
        "/login", "/register", "/events", "/events/{id}",
        "/user/dashboard", "/user/registrations", "/user/profile",
        "/organizer/dashboard", "/organizer/events", "/organizer/events/create",
        "/organizer/events/edit/{id}", "/organizer/events/{id}/registrations",
        "/admin/dashboard", "/admin/users", "/admin/events", "/admin/registrations"
    })
    public String forwardToApplication() {
        return "forward:/index.html";
    }
}
