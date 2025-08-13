package com.openclassrooms.mddapi.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.Instant;

@Entity
@Table(name = "subscriptions", uniqueConstraints = {
        @UniqueConstraint(name = "uk_sub_user_topic", columnNames = {"user_id","topic_id"})
})
@Getter @Setter
public class Subscription {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "topic_id", nullable = false)
    private Topic topic;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public Subscription() {}  // constructeur no-arg requis par JPA

    public Subscription(User user, Topic topic) { // (facultatif) pratique si tu veux new Subscription(u,t)
        this.user = user;
        this.topic = topic;
        this.createdAt = Instant.now();
    }
}
