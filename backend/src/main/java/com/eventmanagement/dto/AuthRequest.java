package com.eventmanagement.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record AuthRequest(
    @NotBlank(message = "Full name is required.")
    @Size(max = 100, message = "Full name must be 100 characters or fewer.")
    String name,
    @NotBlank(message = "Email is required.")
    @Email(message = "Enter a valid email address.")
    @Size(max = 254, message = "Email must be 254 characters or fewer.")
    String email,
    @NotBlank(message = "Password is required.")
    @Size(min = 8, max = 100, message = "Password must be between 8 and 100 characters.")
    @Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).+$",
        message = "Password must include an uppercase letter, a lowercase letter, and a number."
    )
    String password,
    @NotBlank(message = "Phone number is required.")
    @Pattern(regexp = "^(?=(?:\\D*\\d){7,15}\\D*$)\\+?[0-9().\\s-]{7,20}$", message = "Enter a valid phone number.")
    String phone,
    String role
) {
}
