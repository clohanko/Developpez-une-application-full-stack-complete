package com.openclassrooms.mddapi.security;

import com.openclassrooms.mddapi.model.User;
import com.openclassrooms.mddapi.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String identifier) throws UsernameNotFoundException {
        final String login = identifier == null ? "" : identifier.trim();
// Throw exception ici
        User user = userRepository.findByEmailIgnoreCase(login)
                .or(() -> userRepository.findByUsernameIgnoreCase(login))
                .orElseThrow(() ->
                        new UsernameNotFoundException("Aucun utilisateur trouvé avec l’identifiant : " + login));

        return new UserDetailsImpl(user);
    }
}
