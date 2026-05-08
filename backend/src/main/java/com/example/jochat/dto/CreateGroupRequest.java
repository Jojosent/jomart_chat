package com.example.jochat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

public class CreateGroupRequest {

    @NotBlank(message = "Group name is required")
    @Size(min = 2, max = 50, message = "Name must be 2–50 characters")
    private String name;

    @Size(max = 200, message = "Description max 200 characters")
    private String description;

    private List<Long> memberIds;

    public CreateGroupRequest() {}

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public List<Long> getMemberIds() { return memberIds; }
    public void setMemberIds(List<Long> memberIds) { this.memberIds = memberIds; }
}