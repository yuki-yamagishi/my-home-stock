package com.myhomestock.service;

import com.myhomestock.domain.security.CustomOAuth2User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CustomOidcUserService extends OidcUserService {

    private static final Logger log = LoggerFactory.getLogger(CustomOidcUserService.class);

    private final UserHouseholdSyncService syncService;

    public CustomOidcUserService(UserHouseholdSyncService syncService) {
        this.syncService = syncService;
    }

    @Override
    @Transactional
    public OidcUser loadUser(OidcUserRequest userRequest) throws OAuth2AuthenticationException {
        log.info("CustomOidcUserService.loadUser called for registration: {}", userRequest.getClientRegistration().getRegistrationId());
        OidcUser oidcUser = super.loadUser(userRequest);

        String sub = oidcUser.getAttribute("sub");
        String email = oidcUser.getAttribute("email");
        String name = oidcUser.getAttribute("name");
        String picture = oidcUser.getAttribute("picture");
        log.info("OidcUser loaded: sub={}, email={}, name={}", sub, email, name);

        if (email == null) {
            throw new OAuth2AuthenticationException("Google account email not found.");
        }

        UserHouseholdSyncService.SyncResult result = syncService.syncUserAndHousehold(sub, email, name, picture);

        return new CustomOAuth2User(
                result.user(),
                result.household(),
                result.role(),
                oidcUser.getAttributes(),
                oidcUser.getIdToken(),
                oidcUser.getUserInfo()
        );
    }
}
