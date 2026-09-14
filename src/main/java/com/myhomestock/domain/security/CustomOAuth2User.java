package com.myhomestock.domain.security;

import com.myhomestock.domain.entity.Household;
import com.myhomestock.domain.entity.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.core.oidc.OidcIdToken;
import org.springframework.security.oauth2.core.oidc.OidcUserInfo;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;

import java.util.Collection;
import java.util.Collections;
import java.util.Map;

public class CustomOAuth2User implements OidcUser {

    private final User user;
    private final Household household;
    private final String role;
    private final Map<String, Object> attributes;
    private final Collection<? extends GrantedAuthority> authorities;
    private final OidcIdToken idToken;
    private final OidcUserInfo userInfo;

    public CustomOAuth2User(User user, Household household, String role, Map<String, Object> attributes) {
        this(user, household, role, attributes, null, null);
    }

    public CustomOAuth2User(User user, Household household, String role, Map<String, Object> attributes,
                            OidcIdToken idToken, OidcUserInfo userInfo) {
        this.user = user;
        this.household = household;
        this.role = role;
        this.attributes = attributes;
        this.authorities = Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + role));
        this.idToken = idToken;
        this.userInfo = userInfo;
    }

    @Override
    public Map<String, Object> getClaims() {
        return attributes;
    }

    @Override
    public OidcUserInfo getUserInfo() {
        return userInfo;
    }

    @Override
    public OidcIdToken getIdToken() {
        return idToken;
    }

    @Override
    public Map<String, Object> getAttributes() {
        return attributes;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getName() {
        return user.getGoogleSub();
    }

    public User getUser() {
        return user;
    }

    public Long getUserId() {
        return user.getId();
    }

    public String getEmail() {
        return user.getEmail();
    }

    public String getDisplayName() {
        return user.getDisplayName();
    }

    public String getPictureUrl() {
        return user.getPictureUrl();
    }

    public Household getHousehold() {
        return household;
    }

    public Long getHouseholdId() {
        return household != null ? household.getId() : null;
    }

    public String getHouseholdName() {
        return household != null ? household.getName() : null;
    }

    public String getRole() {
        return role;
    }
}
