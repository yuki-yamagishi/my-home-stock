package com.myhomestock.domain.entity;

public enum RemainingLevel {
    EMPTY(0, "すっからかん"),
    LOW(1, "怪しい"),
    PLENTY(2, "まだまだ"),
    FULL(3, "十分");

    private final int level;
    private final String label;

    RemainingLevel(int level, String label) {
        this.level = level;
        this.label = label;
    }

    public int getLevel() {
        return level;
    }

    public String getLabel() {
        return label;
    }

    /**
     * 残量を1段階下げる（FULL -> PLENTY -> LOW -> EMPTY -> EMPTY）
     */
    public RemainingLevel decrease() {
        return switch (this) {
            case FULL -> PLENTY;
            case PLENTY -> LOW;
            case LOW, EMPTY -> EMPTY;
        };
    }

    /**
     * 残量を1段階上げる（EMPTY -> LOW -> PLENTY -> FULL -> FULL）
     */
    public RemainingLevel increase() {
        return switch (this) {
            case EMPTY -> LOW;
            case LOW -> PLENTY;
            case PLENTY, FULL -> FULL;
        };
    }
}
