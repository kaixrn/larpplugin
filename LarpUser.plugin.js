/**
 * @name st6replugin
 * @version 4.0.0
 * @description Full-spectrum larping: Chat, Popouts, and Edit Profile Settings.
 * @author st6re
 */

module.exports = class st6replugin {
    constructor() {
        this.settings = {
            username: "1y", // set your user
            display: "st6re",
            id: "1337133713371337",
            avatarUrl: "", // set avatar URL
            bannerUrl: "https://i.imgur.com/yourbanner.png"
        };
        this.badges = [
            "https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/discordnitro.svg", // Set your Badges
            "https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/discordboost9.svg",
            "https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/activedeveloper.svg"
        ];
    }

    start() {
        this.patchAllTheShit();
        this.observer = new MutationObserver(() => this.injectBadges());
        this.observer.observe(document.body, { childList: true, subtree: true });
        BdApi.UI.showToast("St6re active", { type: "success" });
    }

    patchAllTheShit() {
        const UserStore = BdApi.Webpack.getModule(m => m.getCurrentUser && m.getUser);
        const SettingsStore = BdApi.Webpack.getModule(m => m.getName?.() === "UserProfileStore" || m.getUserProfile);
        
        const forceUser = (user) => {
            if (!user) return;
            user.username = this.settings.username;
            user.globalName = this.settings.display;
            user.id = this.settings.id;
            user.getAvatarURL = () => this.settings.avatarUrl;
            user.getAvatarSource-custom = () => ({ uri: this.settings.avatarUrl });
            user.avatar = "st6re"; // Dummy hash to trigger rendering
        };

        // 1. Patch the User Store
        BdApi.Patcher.after("st6re", UserStore, "getCurrentUser", (_, __, user) => forceUser(user));
        BdApi.Patcher.after("st6re", UserStore, "getUser", (_, [id], user) => {
            if (id === UserStore.getCurrentUser()?.id) forceUser(user);
        });

        // 2. Patch the Profile Preview (The 'Edit Profile' screen)
        if (SettingsStore) {
            BdApi.Patcher.after("st6replugin", SettingsStore, "getUserProfile", (_, [id], profile) => {
                if (!profile) return profile;
                profile.userId = this.settings.id;
                // Force banner and customization in preview
                return profile;
            });
        }

        // 3. Force the Avatar components directly
        const AvatarModule = BdApi.Webpack.getModule(m => m?.toString?.().includes("animatedAvatar") && m?.default);
        if (AvatarModule) {
            BdApi.Patcher.before("st6replugin", AvatarModule, "default", (_, [props]) => {
                if (props?.user?.id === UserStore.getCurrentUser()?.id) {
                    props.src = this.settings.avatarUrl;
                }
            });
        }
    }

    injectBadges() {
        // Targeted CSS injection for the Edit Profile preview and Popouts
        const selectors = '.profileBadges, .badgeList, [class*="containerWithContent"], [class*="badgesContainer"]';
        const containers = document.querySelectorAll(selectors);
        
        containers.forEach(container => {
            if (container.hasAttribute("data-st6re-patched")) return;
            container.setAttribute("data-st6re-patched", "true");

            this.badges.forEach(url => {
                const img = document.createElement("img");
                img.src = url;
                img.style = "width: 20px; height: 20px; margin: 2px; border-radius: 4px; object-fit: contain;";
                container.appendChild(img);
            });
        });
    }

    stop() {
        BdApi.Patcher.unpatchAll("st6replugin");
        if (this.observer) this.observer.disconnect();
    }
};