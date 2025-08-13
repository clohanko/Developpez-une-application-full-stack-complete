package com.openclassrooms.mddapi.service;

import com.openclassrooms.mddapi.model.Subscription;
import com.openclassrooms.mddapi.model.Topic;
import com.openclassrooms.mddapi.model.User;
import com.openclassrooms.mddapi.repository.SubscriptionRepository;
import com.openclassrooms.mddapi.repository.TopicRepository;
import com.openclassrooms.mddapi.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class SubscriptionService {
    private final SubscriptionRepository subRepo;
    private final TopicRepository topicRepo;
    private final UserRepository userRepo;

    public SubscriptionService(SubscriptionRepository s, TopicRepository t, UserRepository u) {
        this.subRepo = s; this.topicRepo = t; this.userRepo = u;
    }

    @Transactional
    public void subscribe(String principalName, Long topicId) {
        User user = findUserByPrincipal(principalName);
        Topic topic = topicRepo.findById(topicId).orElseThrow();
        subRepo.findByUserAndTopic(user, topic).orElseGet(() -> {
            Subscription s = new Subscription();
            s.setUser(user);
            s.setTopic(topic);
            return subRepo.save(s);
        });
    }

    @Transactional
    public void unsubscribe(String principalName, Long topicId) {
        User user = findUserByPrincipal(principalName);
        Topic topic = topicRepo.findById(topicId).orElseThrow();
        subRepo.findByUserAndTopic(user, topic).ifPresent(subRepo::delete);
    }

    private User findUserByPrincipal(String principalName) {
        // essaie par email puis par username, adapte selon tes repos
        return userRepo.findByEmail(principalName)
                .or(() -> userRepo.findByUsername(principalName))
                .orElseThrow();
    }

    @Transactional(readOnly = true)
    public List<Long> listTopicIds(String principalName) {
        User user = findUserByPrincipal(principalName);
        return subRepo.findByUser(user).stream()
                .map(s -> s.getTopic().getId())
                .toList();
    }
}
