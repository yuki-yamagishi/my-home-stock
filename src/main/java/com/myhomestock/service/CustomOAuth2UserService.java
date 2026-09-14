package com.myhomestock.service;

import com.myhomestock.domain.security.CustomOAuth2User;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private static final Logger log = LoggerFactory.getLogger(CustomOAuth2UserService.class);

    private final UserHouseholdSyncService syncService;

    public CustomOAuth2UserService(UserHouseholdSyncService syncService) {
        this.syncService = syncService;
    }

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        log.info("CustomOAuth2UserService.loadUser called for registration: {}", userRequest.getClientRegistration().getRegistrationId());
        OAuth2User oAuth2User = super.loadUser(userRequest);

        String sub = oAuth2User.getAttribute("sub");
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        String picture = oAuth2User.getAttribute("picture");
        log.info("OAuth2User attributes loaded: sub={}, email={}, name={}", sub, email, name);

        if (email == null) {
            throw new OAuth2AuthenticationException("Google account email not found.");
        }

        UserHouseholdSyncService.SyncResult result = syncService.syncUserAndHousehold(sub, email, name, picture);

        return new CustomOAuth2User(result.user(), result.household(), result.role(), oAuth2User.getAttributes());
    }
}
